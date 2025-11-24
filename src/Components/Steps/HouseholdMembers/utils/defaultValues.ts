import { HouseholdData } from '../../../../Types/FormData';
import { determineDefaultIncomeByAge } from '../../../AgeCalculation/AgeCalculation';

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
 * Based on their form progress and age
 */
export const determineDefaultHasIncome = (householdMemberFormData: HouseholdData | undefined): string => {
  if (!householdMemberFormData) {
    return 'false';
  }

  // If member has income streams, they definitely have income
  if (householdMemberFormData.incomeStreams.length > 0) {
    return 'true';
  }

  // If member has health insurance selections, they've been through this page before
  // (income section comes before health insurance in the form flow)
  const hasProgressedThroughForm =
    householdMemberFormData.healthInsurance &&
    Object.values(householdMemberFormData.healthInsurance).some((v) => v === true);

  if (hasProgressedThroughForm) {
    return householdMemberFormData.hasIncome ? 'true' : 'false';
  }

  // First time visiting this page - use age-based logic
  return determineDefaultIncomeByAge(householdMemberFormData);
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
