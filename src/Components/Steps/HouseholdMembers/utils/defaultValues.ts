import { HouseholdData } from '../../../../Types/FormData';

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
 * Default conditions object
 */
export const DEFAULT_CONDITIONS = {
  student: false,
  pregnant: false,
  blindOrVisuallyImpaired: false,
  disabled: false,
  longTermDisability: false,
  none: false,
};

/**
 * Determines whether a household member should default to having income
 * Since there's no explicit yes/no question in the UI, this is derived from income streams
 */
export const determineDefaultHasIncome = (householdMemberFormData: HouseholdData | undefined): string => {
  if (!householdMemberFormData) {
    return 'false';
  }

  // hasIncome is directly derived from whether there are income streams
  // This ensures the form state matches the actual data
  return householdMemberFormData.incomeStreams.length > 0 ? 'true' : 'false';
};

/**
 * Creates default form values for household member
 */
export const createDefaultValues = (
  householdMemberFormData: HouseholdData | undefined,
  shouldShowBasicInfo: boolean
) => {
  const baseDefaultValues = {
    healthInsurance: householdMemberFormData?.healthInsurance ?? DEFAULT_HEALTH_INSURANCE,
    conditions: householdMemberFormData?.conditions ?? DEFAULT_CONDITIONS,
    hasIncome: determineDefaultHasIncome(householdMemberFormData),
    incomeStreams: householdMemberFormData?.incomeStreams ?? [],
  };

  if (!shouldShowBasicInfo) {
    return baseDefaultValues;
  }

  return {
    ...baseDefaultValues,
    birthMonth:
      householdMemberFormData?.birthMonth && householdMemberFormData.birthMonth > 0
        ? householdMemberFormData.birthMonth
        : 0,
    birthYear:
      householdMemberFormData?.birthYear && householdMemberFormData.birthYear > 0
        ? householdMemberFormData.birthYear
        : ('' as unknown as number),
    relationshipToHH: householdMemberFormData?.relationshipToHH ?? '',
  };
};
