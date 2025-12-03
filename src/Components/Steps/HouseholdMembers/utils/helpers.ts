import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType } from '../../../../Types/Questions';
import { FREQUENCY_ORDER, ERROR_SECTION_MAP } from './constants';

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
 * Calculates age from birth year and month
 */
export const calculateAge = (birthYear?: number, birthMonth?: number): number | null => {
  if (!birthYear || !birthMonth) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 0-indexed

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth) {
    age--;
  }
  return age;
};

// ============================================================================
// FORM SUBMISSION HELPERS
// ============================================================================

interface CreateHouseholdMemberDataParams {
  memberData: any;
  currentMemberIndex: number;
  existingHouseholdData: HouseholdData[];
  shouldShowBasicInfo: boolean;
  householdMemberFormData?: HouseholdData;
}

/**
 * Creates updated household member data for form submission
 * Handles conditional inclusion of basic info fields (birthYear, birthMonth, relationshipToHH)
 */
export const createHouseholdMemberData = ({
  memberData,
  currentMemberIndex,
  existingHouseholdData,
  shouldShowBasicInfo,
  householdMemberFormData,
}: CreateHouseholdMemberDataParams): HouseholdData => {
  const result = {
    ...memberData,
    id: existingHouseholdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
    frontendId: existingHouseholdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
    birthYear: shouldShowBasicInfo && 'birthYear' in memberData
      ? (memberData.birthYear as number)
      : (householdMemberFormData?.birthYear ?? 0),
    birthMonth: shouldShowBasicInfo && 'birthMonth' in memberData
      ? (memberData.birthMonth as number)
      : (householdMemberFormData?.birthMonth ?? 0),
    relationshipToHH: shouldShowBasicInfo && 'relationshipToHH' in memberData
      ? (memberData.relationshipToHH as string)
      : (householdMemberFormData?.relationshipToHH ?? ''),
    hasIncome: memberData.hasIncome === 'true',
  } as HouseholdData;

  return result;
};

/**
 * Scrolls to the first form section with an error
 * Falls back to scrolling to top if no error section is found
 */
export const scrollToFirstError = (formErrors: Record<string, any>): void => {
  // Scroll to the first section with an error
  for (const section of ERROR_SECTION_MAP) {
    if (formErrors[section.key]) {
      const element = document.getElementById(section.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }

  // Fallback to scrolling to top if no section found
  window.scroll({ top: 0, left: 0, behavior: 'smooth' });
};
