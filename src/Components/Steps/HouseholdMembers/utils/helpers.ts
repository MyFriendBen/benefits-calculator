import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType } from '../../../../Types/Questions';
import { calcAge } from '../../../../Assets/age';
import {
  FREQUENCY_ORDER,
  ERROR_SECTION_MAP,
  ENERGY_CALCULATOR_ERROR_SECTION_MAP,
  EMPLOYMENT_CATEGORY,
  WAGES_SOURCE,
} from './constants';
import { IncomeStreamFormData, WorkflowType } from './types';
import { HouseholdMemberFormSchema, EnergyCalculatorHouseholdMemberFormSchema } from './schema';
export { formatToUSD } from '../../../../utils/formatCurrency';

// ============================================================================
// INCOME QUESTION BUCKETING
// ============================================================================

/**
 * The three income questions shown per household member. Each gates whether its
 * income input(s) appear:
 * - employed: "Are you currently employed?" — employment-category streams.
 * - gig: "Do you earn any money from freelance, gig, or occasional work?" —
 *   only shown when `employed` is No; a single self-employment stream.
 * - other: "Do you receive any government benefits, child support, alimony...?" —
 *   all non-employment-category streams.
 */
export type IncomeAnswers = {
  employed: boolean;
  gig: boolean;
  other: boolean;
};

/** Streams under the "Are you currently employed?" question (employment category). */
export const isEmploymentStream = (s: Pick<IncomeStreamFormData, 'incomeCategory'>): boolean =>
  s.incomeCategory === EMPLOYMENT_CATEGORY;

/** Streams under the "government benefits / other recurring payments" question. */
export const isOtherStream = (s: Pick<IncomeStreamFormData, 'incomeCategory'>): boolean =>
  !!s.incomeCategory && s.incomeCategory !== EMPLOYMENT_CATEGORY;

/**
 * Derives the three Yes/No answers from persisted income streams so the toggles
 * rehydrate correctly on edit/reload. Streams remain the source of truth.
 *
 * Rules:
 * - `other` is Yes if any non-employment-category stream exists.
 * - Employment streams are attributed to Q1 vs Q2 by the "Q2 only when Q1 is No"
 *   rule: if any employment stream is `wages`, the member is treated as employed
 *   (Q1 Yes) and Q2 stays hidden. If the only employment income is
 *   self-employment, it is treated as gig income (Q1 No, Q2 Yes).
 */
export const deriveIncomeAnswers = (
  streams: Pick<IncomeStreamFormData, 'incomeCategory' | 'incomeStreamName'>[] = [],
): IncomeAnswers => {
  const employmentStreams = streams.filter(isEmploymentStream);
  const hasWages = employmentStreams.some((s) => s.incomeStreamName === WAGES_SOURCE);
  const hasEmployment = employmentStreams.length > 0;

  const employed = hasWages;
  // Gig only surfaces when not employed; treat employment-only-self-employment as gig.
  const gig = !employed && hasEmployment;
  const other = streams.some(isOtherStream);

  return { employed, gig, other };
};

// ============================================================================
// GENERIC FORM HELPERS
// ============================================================================

/**
 * Determines default form items (e.g., income streams) based on context.
 * Returns existing items if available, or seeds a single empty item for
 * eligible members on their absolute first visit.
 *
 * Seeding logic:
 * - If existingItems has entries → always return them (truth of record).
 * - If hasCompletedDownstreamField is true → user already submitted once;
 *   an empty state ([] or undefined) means they deliberately cleared it. Respect that.
 * - Otherwise (no downstream progress) → first visit: seed one item if eligible.
 *
 * @param existingItems - Current items from saved form data (undefined = never visited)
 * @param hasCompletedDownstreamField - Whether the user has already submitted the form before
 * @param isEligible - Whether member qualifies for a default item (e.g. working age)
 * @param emptyTemplate - The empty item to seed on first visit
 */
export function getDefaultFormItems<T>(
  existingItems: T[] | undefined,
  hasCompletedDownstreamField: boolean,
  isEligible: boolean,
  emptyTemplate: T,
): T[] {
  // Existing items always win.
  if (existingItems && existingItems.length > 0) {
    return existingItems;
  }
  // User has progressed past this section — an empty state is intentional.
  if (hasCompletedDownstreamField) {
    return [];
  }
  // First visit (no downstream progress): seed one item if eligible.
  if (isEligible) {
    return [emptyTemplate];
  }
  return [];
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Sorts frequency options from least frequent to most frequent
 */
export const sortFrequencyOptions = (
  frequencyOptions: Record<string, FormattedMessageType>
): Record<string, FormattedMessageType> => {
  return Object.fromEntries([
    ...FREQUENCY_ORDER
      .filter(key => frequencyOptions[key])
      .map(key => [key, frequencyOptions[key]]),
    ...Object.entries(frequencyOptions)
      .filter(([key]) => !FREQUENCY_ORDER.includes(key))
  ]);
};

/**
 * Calculates age from birth year and month.
 * Delegates to the shared calcAge utility so age display is consistent
 * with summary cards and other parts of the app.
 */
export const calculateAge = (birthYear?: number, birthMonth?: number): number | null => {
  if (!birthYear || !birthMonth) return null;
  return calcAge({ birthYear, birthMonth } as HouseholdData);
};

// ============================================================================
// FORM SUBMISSION HELPERS
// ============================================================================

type MainMemberDataParams = {
  memberData: HouseholdMemberFormSchema;
  currentMemberIndex: number;
  existingHouseholdData: HouseholdData[];
  workflowType?: 'main';
};

type EcMemberDataParams = {
  memberData: EnergyCalculatorHouseholdMemberFormSchema;
  currentMemberIndex: number;
  existingHouseholdData: HouseholdData[];
  workflowType: 'energyCalculator';
};

type CreateHouseholdMemberDataParams = MainMemberDataParams | EcMemberDataParams;

/**
 * Creates updated household member data for form submission.
 * For EC workflow, also builds the energyCalculator sub-object from form conditions.
 */
export const createHouseholdMemberData = (params: CreateHouseholdMemberDataParams): HouseholdData => {
  const { memberData, currentMemberIndex, existingHouseholdData } = params;

  const incomeStreams = (memberData.incomeStreams || []).map((stream) => ({
    ...stream,
    incomeAmount: Number(stream.incomeAmount),
    hoursPerWeek: stream.hoursPerWeek === '' ? 0 : Number(stream.hoursPerWeek),
  }));
  const hasIncome = incomeStreams.length > 0;

  // The income-question answers are form-only fields. Only `is_employed` is
  // persisted — gig and other are re-derived from the streams on load.
  // Strip the form-only answer fields from the spread so they don't leak onto the
  // persisted member object.
  const { incomeEmployed, incomeGig: _gig, incomeOther: _other, ...restMemberData } =
    memberData as typeof memberData & {
      incomeEmployed?: boolean | null;
      incomeGig?: boolean | null;
      incomeOther?: boolean | null;
    };

  const base = {
    ...restMemberData,
    id: existingHouseholdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
    frontendId: existingHouseholdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
    hasIncome,
    isEmployed: incomeEmployed ?? null,
    incomeStreams,
  };

  if (params.workflowType === 'energyCalculator') {
    const ecData = params.memberData;
    return {
      ...base,
      conditions: {
        disabled: ecData.conditions.disabled,
      },
      energyCalculator: {
        survivingSpouse: ecData.conditions.survivingSpouse,
        receivesSsi: ecData.receivesSsi === 'true',
        medicalEquipment: ecData.conditions.medicalEquipment,
      },
    // EC adds `energyCalculator` which is not on the shared HouseholdData base type;
    // the double cast avoids TS requiring every EC-only field to be on HouseholdData.
    } as unknown as HouseholdData;
  }

  return base as HouseholdData;
};

/**
 * Scrolls to the first form section with an error
 * Falls back to scrolling to top if no error section is found
 */
export const scrollToFirstError = (formErrors: Record<string, any>, workflowType: WorkflowType = 'main'): void => {
  const sectionMap = workflowType === 'energyCalculator' ? ENERGY_CALCULATOR_ERROR_SECTION_MAP : ERROR_SECTION_MAP;

  for (const section of sectionMap) {
    if (!formErrors[section.key]) continue;

    // For array errors, find the first row element (e.g. income-stream-0)
    // and scroll to it; otherwise fall back to the enclosing section container.
    if (Array.isArray(formErrors[section.key])) {
      const firstErrorIndex = (formErrors[section.key] as any[]).findIndex((row) => row != null);
      const target =
        (firstErrorIndex !== -1 && document.getElementById(`${section.id}-${firstErrorIndex}`)) ||
        document.getElementById('income-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      continue;
    }

    const element = document.getElementById(section.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }

  // Fallback to scrolling to top if no section found
  window.scroll({ top: 0, left: 0, behavior: 'smooth' });
};
