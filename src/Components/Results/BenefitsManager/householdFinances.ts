/**
 * Pure helpers behind the Benefits Manager demo's income, savings and needs panels.
 *
 * Income and savings write back to the real screen (so eligibility genuinely re-runs);
 * accounts and the needs ranking live only in the browser.
 */
import { FormData, HouseholdData, IncomeStream } from '../../../Types/FormData';
import { Program, ProgramCategory } from '../../../Types/Results';
import { calcIncomeStreamAmount, calcTotalIncome } from '../../../Assets/income';
import { programValue } from '../FormattedValue';

// ---------- Income ----------

export const householdMonthlyIncome = (formData: FormData) => Math.round(calcTotalIncome(formData) / 12);

// How many of a stream's own units make up one year, so an annual figure converts back.
function unitsPerYear(stream: IncomeStream): number {
  switch (stream.incomeFrequency) {
    case 'weekly':
      return 52;
    case 'biweekly':
      return 26;
    case 'semimonthly':
      return 24;
    case 'monthly':
      return 12;
    case 'yearly':
      return 1;
    case 'hourly':
      return Math.max(stream.hoursPerWeek, 1) * 52;
    default:
      return 12;
  }
}

/**
 * The screener stores income per member, per stream; the manager shows one household
 * figure. To write that figure back, the whole difference goes onto the head of
 * household's largest stream, so every other stream and member stays as entered. A head
 * with no income gets a single monthly wages stream; a stream taken to zero is removed.
 */
export function withHouseholdMonthlyIncome(formData: FormData, targetMonthly: number): FormData {
  const deltaAnnual = (Math.max(0, targetMonthly) - householdMonthlyIncome(formData)) * 12;
  if (Math.round(deltaAnnual) === 0) {
    return formData;
  }

  const headIndex = Math.max(
    0,
    formData.householdData.findIndex((member) => member.relationshipToHH === 'headOfHousehold'),
  );
  const head = formData.householdData[headIndex];
  if (head === undefined) {
    return formData;
  }

  let streams: IncomeStream[];
  if (head.incomeStreams.length === 0) {
    streams =
      deltaAnnual > 0
        ? [
            {
              incomeCategory: 'employment',
              incomeStreamName: 'wages',
              incomeAmount: Math.round((deltaAnnual / 12) * 100) / 100,
              incomeFrequency: 'monthly',
              hoursPerWeek: 0,
            },
          ]
        : [];
  } else {
    const largest = head.incomeStreams.reduce(
      (best, stream, i, all) => (calcIncomeStreamAmount(stream) > calcIncomeStreamAmount(all[best]) ? i : best),
      0,
    );
    const stream = head.incomeStreams[largest];
    const newAnnual = Math.max(0, calcIncomeStreamAmount(stream) + deltaAnnual);
    const newAmount = Math.round((newAnnual / unitsPerYear(stream)) * 100) / 100;
    streams =
      newAmount > 0
        ? head.incomeStreams.map((s, i) => (i === largest ? { ...s, incomeAmount: newAmount } : s))
        : head.incomeStreams.filter((_, i) => i !== largest);
  }

  const newHead: HouseholdData = { ...head, incomeStreams: streams, hasIncome: streams.length > 0 };
  return {
    ...formData,
    householdData: formData.householdData.map((member, i) => (i === headIndex ? newHead : member)),
  };
}

// ---------- Savings accounts ----------

export type SavingsAccount = {
  id: string;
  name: string;
  balance: number;
};

export const accountsTotal = (accounts: SavingsAccount[]) =>
  accounts.reduce((total, account) => total + account.balance, 0);

export const newAccountId = () => `acct-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// ---------- Needs ----------

export type NeedId =
  | 'housing'
  | 'food'
  | 'utilities'
  | 'health_care'
  | 'child_care'
  | 'transportation'
  | 'cash'
  | 'jobs';

type NeedDefinition = {
  label: string;
  /** Program category external_names that meet this need. */
  categories: string[];
  /** Words in a program's name that meet this need, for needs no category covers. */
  keywords: string[];
};

export const NEEDS: Record<NeedId, NeedDefinition> = {
  housing: { label: 'Housing & rent', categories: ['housing'], keywords: ['rent', 'housing'] },
  food: { label: 'Food', categories: ['food'], keywords: ['snap', 'wic', 'meal', 'food'] },
  utilities: {
    label: 'Utilities',
    categories: [],
    keywords: [
      'utility',
      'utilities',
      'energy',
      'heat',
      'leap',
      'lifeline',
      'internet',
      'water',
      'electric',
      'weatherization',
      'trash',
    ],
  },
  health_care: { label: 'Health care', categories: ['health_care'], keywords: ['medicaid', 'health', 'dental'] },
  child_care: { label: 'Child care', categories: ['child_care'], keywords: ['child care', 'preschool', 'cccap'] },
  transportation: { label: 'Transportation', categories: ['transportation'], keywords: ['transit', 'rtd', 'fare'] },
  cash: { label: 'Cash for bills', categories: ['cash'], keywords: ['tanf', 'cash', 'ssi', 'income'] },
  jobs: { label: 'Work & training', categories: ['employment', 'education'], keywords: ['job', 'training', 'college'] },
};

export const DEFAULT_NEEDS: NeedId[] = ['housing', 'food', 'utilities', 'health_care'];

export const ALL_NEEDS = Object.keys(NEEDS) as NeedId[];

export function programCategoryIndex(categories: ProgramCategory[]): Map<number, string> {
  const index = new Map<number, string>();
  for (const category of categories) {
    for (const program of category.programs) {
      index.set(program.program_id, category.external_name);
    }
  }
  return index;
}

export function programMeetsNeed(program: Program, need: NeedId, categoryOf: Map<number, string>): boolean {
  const definition = NEEDS[need];
  const name = `${program.name.default_message} ${program.name_abbreviated}`.toLowerCase();
  // Utility programs (LEAP, Lifeline…) share the housing category; they answer Utilities, not rent.
  if (need === 'housing' && NEEDS.utilities.keywords.some((keyword) => name.includes(keyword))) {
    return false;
  }
  const category = categoryOf.get(program.program_id);
  if (category !== undefined && definition.categories.includes(category)) {
    return true;
  }
  return definition.keywords.some((keyword) => name.includes(keyword));
}

/**
 * The next application is the most valuable program that meets the highest-ranked need
 * with any match; if no need has a match, simply the most valuable program in the pool.
 */
export function pickNextApplication(
  pool: Program[],
  rankedNeeds: NeedId[],
  categoryOf: Map<number, string>,
): { program: Program; need: NeedId | null } | null {
  if (pool.length === 0) return null;
  const mostValuable = (programs: Program[]) =>
    programs.reduce((best, p) => (programValue(p) > programValue(best) ? p : best));

  for (const need of rankedNeeds) {
    const matching = pool.filter((program) => programMeetsNeed(program, need, categoryOf));
    if (matching.length > 0) {
      return { program: mostValuable(matching), need };
    }
  }
  return { program: mostValuable(pool), need: null };
}

// ---------- What changed after a recalculation ----------

export type ProgramChange = {
  program: Program;
  beforeMonthly: number;
  afterMonthly: number;
};

export type RecalcDiff = {
  changed: ProgramChange[];
  added: Program[];
  removed: Program[];
};

const monthly = (program: Program) => Math.round(programValue(program) / 12);

export function diffPrograms(before: Program[], after: Program[]): RecalcDiff {
  const beforeById = new Map(before.map((p) => [p.program_id, p]));
  const afterIds = new Set(after.map((p) => p.program_id));

  const changed: ProgramChange[] = [];
  const added: Program[] = [];
  for (const program of after) {
    const previous = beforeById.get(program.program_id);
    if (previous === undefined) {
      added.push(program);
    } else if (monthly(previous) !== monthly(program)) {
      changed.push({ program, beforeMonthly: monthly(previous), afterMonthly: monthly(program) });
    }
  }
  const removed = before.filter((p) => !afterIds.has(p.program_id));

  return { changed, added, removed };
}
