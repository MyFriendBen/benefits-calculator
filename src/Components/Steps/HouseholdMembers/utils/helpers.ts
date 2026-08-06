import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType } from '../../../../Types/Questions';
import { calcAge } from '../../../../Assets/age';
import {
  FREQUENCY_ORDER,
  ERROR_SECTION_MAP,
  ENERGY_CALCULATOR_ERROR_SECTION_MAP,
  EMPLOYMENT_CATEGORY,
  WAGES_SOURCE,
  SELF_EMPLOYMENT_SOURCE,
} from './constants';
import { IncomeStreamFormData, WorkflowType } from './types';
import { HouseholdMemberFormSchema, EnergyCalculatorHouseholdMemberFormSchema } from './schema';
export { formatToUSD } from '../../../../utils/formatCurrency';

// ============================================================================
// INCOME QUESTION BUCKETING
// ============================================================================

/**
 * The three income questions shown per household member. Each is answered
 * independently and gates its own income input(s):
 * - employed: "Are they currently employed?" — wages-source streams.
 * - gig: "Do they earn any money from freelance, gig, or occasional work?" —
 *   self-employment-source streams.
 * - other: "Do they receive any government benefits, child support, alimony...?" —
 *   all non-employment-category streams.
 */
export type IncomeAnswers = {
  employed: boolean;
  gig: boolean;
  other: boolean;
};

/** Wages streams — the "Are they currently employed?" question (Q1). */
export const isWagesStream = (s: Pick<IncomeStreamFormData, 'incomeCategory' | 'incomeStreamName'>): boolean =>
  s.incomeCategory === EMPLOYMENT_CATEGORY && s.incomeStreamName === WAGES_SOURCE;

/** Self-employment streams — the "freelance, gig, or occasional work?" question (Q2). */
export const isSelfEmploymentStream = (s: Pick<IncomeStreamFormData, 'incomeCategory' | 'incomeStreamName'>): boolean =>
  s.incomeCategory === EMPLOYMENT_CATEGORY && s.incomeStreamName === SELF_EMPLOYMENT_SOURCE;

/** Non-employment streams — the "government benefits / other recurring payments" question (Q3). */
export const isOtherStream = (s: Pick<IncomeStreamFormData, 'incomeCategory'>): boolean =>
  !!s.incomeCategory && s.incomeCategory !== EMPLOYMENT_CATEGORY;

/**
 * Whether a stream belongs to the Q3 ("other") bucket for row rendering and
 * removal — anything that isn't a wages or self-employment row. This is broader
 * than isOtherStream: a freshly-appended Q3 row has no category chosen yet, so
 * isOtherStream is false for it, but it must still render (and be removable)
 * under Q3. Q1/Q2 rows are always seeded with their source, so the negation is
 * exact.
 */
export const isOtherBucketStream = (s: Pick<IncomeStreamFormData, 'incomeCategory' | 'incomeStreamName'>): boolean =>
  !isWagesStream(s) && !isSelfEmploymentStream(s);

/**
 * Derives the three Yes/No answers from income streams so the toggles rehydrate
 * on edit/reload. Each answer is independent and keyed to its source:
 * - employed: any wages stream exists.
 * - gig: any self-employment stream exists.
 * - other: any non-employment-category stream exists.
 */
export const deriveIncomeAnswers = (
  streams: Pick<IncomeStreamFormData, 'incomeCategory' | 'incomeStreamName'>[] = [],
): IncomeAnswers => ({
  employed: streams.some(isWagesStream),
  gig: streams.some(isSelfEmploymentStream),
  other: streams.some(isOtherStream),
});

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

  // The three income-question answers are form-only fields — the answers are
  // re-derived from the streams on load, so strip them from the spread rather
  // than persist them on the member object.
  const { incomeEmployed: _e, incomeGig: _g, incomeOther: _o, ...restMemberData } =
    memberData as typeof memberData & {
      incomeEmployed?: boolean | null;
      incomeGig?: boolean | null;
      incomeOther?: boolean | null;
    };

  const base = {
    ...restMemberData,
    id: existingHouseholdData[currentMemberIndex]?.id,
    frontendId: existingHouseholdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
    hasIncome,
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
