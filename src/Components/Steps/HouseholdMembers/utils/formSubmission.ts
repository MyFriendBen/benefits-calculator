import { HouseholdData } from '../../../../Types/FormData';
import { ERROR_SECTION_MAP } from './constants';

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
  return {
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
