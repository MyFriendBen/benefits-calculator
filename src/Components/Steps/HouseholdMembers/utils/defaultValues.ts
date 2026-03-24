import { HouseholdData } from '../../../../Types/FormData';
import { calculateAgeStatus } from '../../../AgeCalculation/AgeCalculation';
import { EMPTY_INCOME_STREAM } from './constants';
import { getDefaultFormItems } from './helpers';

export const UNSET_BIRTH_YEAR: number | '' = '';

/**
 * Default health insurance object
 */
export const DEFAULT_HEALTH_INSURANCE = {
  none: false,
  employer: false,
  private: false,
  medicaid: false,
  medicare: false,
  chp: false,
  emergency_medicaid: false,
  family_planning: false,
  va: false,
  mass_health: false,
};

/**
 * Default special conditions object
 */
export const DEFAULT_SPECIAL_CONDITIONS = {
  student: false,
  pregnant: false,
  blindOrVisuallyImpaired: false,
  disabled: false,
  longTermDisability: false,
  none: false,
};

/**
 * Helper to check if user has health insurance selections (indicates they've progressed through form)
 */
const hasProgressedThroughForm = (data?: HouseholdData): boolean => {
  // Main workflow: health insurance is filled in after first submission
  if (data?.healthInsurance && Object.values(data.healthInsurance).some((v) => v === true)) {
    return true;
  }
  // EC workflow (CESN): energyCalculator sub-object is only written on form submission,
  // never pre-populated for brand-new members, so its presence means the form was submitted.
  if (data?.energyCalculator !== undefined) {
    return true;
  }
  return false;
};

/**
 * Helper to check if member is working age (16-70)
 */
const isWorkingAge = (birthYear?: number, birthMonth?: number): boolean => {
  if (!birthYear || !birthMonth) return false;
  const { age } = calculateAgeStatus(birthMonth, birthYear);
  return age !== null && age >= 16 && age <= 70;
};

/**
 * Determines default income streams - auto-adds for working-age members on first visit
 */
const getDefaultIncomeStreams = (data?: HouseholdData): any[] => {
  const progressed = hasProgressedThroughForm(data);
  // Normalize [] to undefined when not yet progressed — the API always returns [] for
  // brand-new members, but getDefaultFormItems needs undefined to distinguish
  // "never visited" from "visited and intentionally cleared".
  const existingStreams =
    Array.isArray(data?.incomeStreams) && data!.incomeStreams.length === 0 && !progressed
      ? undefined
      : data?.incomeStreams;

  const streams = getDefaultFormItems(
    existingStreams,
    progressed,
    isWorkingAge(data?.birthYear, data?.birthMonth),
    EMPTY_INCOME_STREAM as any
  );
  return streams.map((stream: any) => ({
    ...stream,
    incomeAmount: stream.incomeAmount == null || stream.incomeAmount === 0 ? '' : String(stream.incomeAmount),
    hoursPerWeek: stream.hoursPerWeek == null || stream.hoursPerWeek === 0 ? '' : String(stream.hoursPerWeek),
  }));
};

/**
 * Determines default special conditions - infers "none" selection from backend data
 */
const getDefaultSpecialConditions = (data?: HouseholdData): typeof DEFAULT_SPECIAL_CONDITIONS => {
  if (!data?.conditions) {
    return DEFAULT_SPECIAL_CONDITIONS;
  }

  const merged = { ...DEFAULT_SPECIAL_CONDITIONS, ...data.conditions };

  // Backend doesn't persist "none" - infer it from context
  const hasAnyCondition = Object.entries(merged)
    .filter(([key]) => key !== 'none')
    .some(([, value]) => value === true);

  const progressed = hasProgressedThroughForm(data);

  // If they've been through form but no special conditions are true, they selected "none"
  if (progressed && !hasAnyCondition) {
    return { ...merged, none: true };
  }

  return merged;
};

/**
 * Default student eligibility object (all undefined = not yet answered)
 */
export const DEFAULT_STUDENT_ELIGIBILITY = {
  studentFullTime: undefined as boolean | undefined,
  studentJobTrainingProgram: undefined as boolean | undefined,
  studentHasWorkStudy: undefined as boolean | undefined,
  studentWorks20PlusHrs: undefined as boolean | undefined,
};

/**
 * Creates default form values for household member
 */
export const createDefaultValues = (
  householdMemberFormData: HouseholdData | undefined,
  isFirstMember: boolean = false
) => {
  const incomeStreams = getDefaultIncomeStreams(householdMemberFormData);

  return {
    birthMonth: householdMemberFormData?.birthMonth && householdMemberFormData.birthMonth > 0
      ? householdMemberFormData.birthMonth
      : 0,
    birthYear: householdMemberFormData?.birthYear && householdMemberFormData.birthYear > 0
      ? householdMemberFormData.birthYear
      : 0,
    relationshipToHH: householdMemberFormData?.relationshipToHH ?? (isFirstMember ? 'headOfHousehold' : ''),
    healthInsurance: householdMemberFormData?.healthInsurance
      ? { ...DEFAULT_HEALTH_INSURANCE, ...householdMemberFormData.healthInsurance }
      : DEFAULT_HEALTH_INSURANCE,
    conditions: getDefaultSpecialConditions(householdMemberFormData),
    studentEligibility: householdMemberFormData?.studentEligibility
      ? { ...DEFAULT_STUDENT_ELIGIBILITY, ...householdMemberFormData.studentEligibility }
      : DEFAULT_STUDENT_ELIGIBILITY,
    incomeStreams,
  };
};

// ============================================================================
// ENERGY CALCULATOR DEFAULT VALUES
// ============================================================================

export const DEFAULT_ENERGY_CALCULATOR_CONDITIONS = {
  survivingSpouse: false,
  disabled: false,
  medicalEquipment: false,
};

/**
 * Creates a default HouseholdData object for a brand-new member on the basic info page.
 * Uses the existing DEFAULT_* constants so any future field additions propagate automatically.
 */
export const createDefaultMember = (index: number, existingMember?: HouseholdData): HouseholdData => ({
  ...existingMember,
  id: existingMember?.id ?? crypto.randomUUID(),
  frontendId: existingMember?.frontendId ?? crypto.randomUUID(),
  birthMonth: existingMember?.birthMonth ?? 0,
  birthYear: existingMember?.birthYear ?? 0,
  relationshipToHH: existingMember?.relationshipToHH ?? (index === 0 ? 'headOfHousehold' : ''),
  conditions: existingMember?.conditions ?? { ...DEFAULT_SPECIAL_CONDITIONS },
  hasIncome: existingMember?.hasIncome ?? false,
  incomeStreams: existingMember?.incomeStreams ?? [],
  healthInsurance: existingMember?.healthInsurance ?? { ...DEFAULT_HEALTH_INSURANCE },
});

export const createEnergyCalculatorDefaultValues = (
  householdMemberFormData: HouseholdData | undefined,
  pageNumber: number,
) => {
  const incomeStreams = getDefaultIncomeStreams(householdMemberFormData);

  return {
    birthMonth: householdMemberFormData?.birthMonth && householdMemberFormData.birthMonth > 0
      ? householdMemberFormData.birthMonth
      : 0,
    birthYear: householdMemberFormData?.birthYear && householdMemberFormData.birthYear > 0
      ? householdMemberFormData.birthYear
      : 0,
    conditions: {
      survivingSpouse: householdMemberFormData?.energyCalculator?.survivingSpouse ?? false,
      disabled: householdMemberFormData?.conditions?.disabled ?? false,
      medicalEquipment: householdMemberFormData?.energyCalculator?.medicalEquipment ?? false,
    },
    receivesSsi: householdMemberFormData?.energyCalculator?.receivesSsi ? 'true' : 'false',
    relationshipToHH: householdMemberFormData?.relationshipToHH
      ?? (pageNumber === 1 ? 'headOfHousehold' : ''),
    incomeStreams,
  };
};
