import { HouseholdData } from '../../../../Types/FormData';
import { calculateAgeStatus } from '../../../AgeCalculation/AgeCalculation';
import { EMPTY_INCOME_STREAM } from './constants';
import { getDefaultFormItems } from '../../../../Assets/formDefaultHelpers';

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
  return !!data?.healthInsurance && Object.values(data.healthInsurance).some((v) => v === true);
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
  return getDefaultFormItems(
    data?.incomeStreams,
    hasProgressedThroughForm(data),
    isWorkingAge(data?.birthYear, data?.birthMonth),
    EMPTY_INCOME_STREAM
  );
};

/**
 * Determines default special conditions - infers "none" selection from backend data
 */
const getDefaultSpecialConditions = (data?: HouseholdData): typeof DEFAULT_SPECIAL_CONDITIONS => {

  if (!data?.specialConditions) {
    return DEFAULT_SPECIAL_CONDITIONS;
  }

  const merged = { ...DEFAULT_SPECIAL_CONDITIONS, ...data.specialConditions };

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
 * Creates default form values for household member
 */
export const createDefaultValues = (
  householdMemberFormData: HouseholdData | undefined,
  shouldShowBasicInfo: boolean,
  isFirstMember: boolean = false
) => {
  const incomeStreams = getDefaultIncomeStreams(householdMemberFormData);

  const baseDefaults = {
    healthInsurance: householdMemberFormData?.healthInsurance
      ? { ...DEFAULT_HEALTH_INSURANCE, ...householdMemberFormData.healthInsurance }
      : DEFAULT_HEALTH_INSURANCE,
    specialConditions: getDefaultSpecialConditions(householdMemberFormData),
    hasIncome: incomeStreams.length > 0 ? 'true' : 'false',
    incomeStreams,
  };

  if (!shouldShowBasicInfo) return baseDefaults;

  return {
    ...baseDefaults,
    birthMonth: householdMemberFormData?.birthMonth && householdMemberFormData.birthMonth > 0
      ? householdMemberFormData.birthMonth
      : 0,
    birthYear: householdMemberFormData?.birthYear && householdMemberFormData.birthYear > 0
      ? householdMemberFormData.birthYear
      : ('' as unknown as number),
    relationshipToHH: householdMemberFormData?.relationshipToHH ?? (isFirstMember ? 'headOfHousehold' : ''),
  };
};
