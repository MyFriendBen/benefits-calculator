import { getCurrentMonthYear } from '../../Assets/age';

export interface AgeCalculationResult {
  is16OrOlder: boolean;
  isUnder16: boolean;
  age: number | null;
}

/**
 * Calculates if a person is 16 years or older based on birth month and year
 * @param birthMonth - Birth month (1-12)
 * @param birthYear - Birth year
 * @returns Object containing age calculation results
 */
export function calculateAgeStatus(
  birthMonth: number | string | undefined,
  birthYear: number | string | undefined
): AgeCalculationResult {
  if (!birthMonth || !birthYear) {
    return {
      is16OrOlder: false,
      isUnder16: true,
      age: null
    };
  }

  const month = Number(birthMonth);
  const year = Number(birthYear);

  if (month <= 0 || year <= 0) {
    return {
      is16OrOlder: false,
      isUnder16: true,
      age: null
    };
  }

  try {
    const { CURRENT_MONTH, CURRENT_YEAR } = getCurrentMonthYear();
    const age = CURRENT_YEAR - year;
    const is16OrOlder = age > 16 || (age === 16 && month <= CURRENT_MONTH);

    return {
      is16OrOlder,
      isUnder16: !is16OrOlder,
      age
    };
  } catch (error) {
    return {
      is16OrOlder: false,
      isUnder16: true,
      age: null
    };
  }
}

/**
 * Determines default income value based on age and existing income streams
 * @param householdMemberFormData - Household member data
 * @returns 'true' if should default to having income, 'false' otherwise
 */
export function determineDefaultIncomeByAge(
  householdMemberFormData: { 
    incomeStreams?: Array<any>; 
    birthYear?: number; 
    birthMonth?: number 
  } | undefined
): 'true' | 'false' {
  if (householdMemberFormData === undefined) {
    return 'false';
  }

  if (householdMemberFormData.incomeStreams && householdMemberFormData.incomeStreams.length > 0) {
    return 'true';
  }

  const { is16OrOlder } = calculateAgeStatus(
    householdMemberFormData.birthMonth,
    householdMemberFormData.birthYear
  );

  return is16OrOlder ? 'true' : 'false';
}