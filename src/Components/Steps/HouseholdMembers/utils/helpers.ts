import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType } from '../../../../Types/Questions';
import { calcAge } from '../../../../Assets/age';
import { FREQUENCY_ORDER, ERROR_SECTION_MAP, ENERGY_CALCULATOR_ERROR_SECTION_MAP } from './constants';
import { WorkflowType } from './types';

// ============================================================================
// GENERIC FORM HELPERS
// ============================================================================

/**
 * Determines default form items (e.g., income streams) based on context.
 * Returns existing items if available, or seeds a single empty item for
 * eligible members on their first visit.
 *
 * "Progressed" is proxied by whether a downstream field (e.g. health insurance)
 * has been answered — if the user has already submitted the form once, an empty
 * items array means they deliberately cleared it and that choice should be respected.
 *
 * @param existingItems - Current items from saved form data (may be undefined)
 * @param hasCompletedDownstreamField - Whether the user has already progressed past this section
 * @param isEligible - Whether member qualifies for a default item (e.g. working age)
 * @param emptyTemplate - The empty item to seed on first visit
 */
export function getDefaultFormItems<T>(
  existingItems: T[] | undefined,
  hasCompletedDownstreamField: boolean,
  isEligible: boolean,
  emptyTemplate: T,
): T[] {
  if (existingItems && existingItems.length > 0) {
    return existingItems;
  }
  if (hasCompletedDownstreamField) {
    return [];
  }
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

/**
 * Formats a number as a USD currency string with no decimal places
 */
export const formatToUSD = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ============================================================================
// FORM SUBMISSION HELPERS
// ============================================================================

interface CreateHouseholdMemberDataParams {
  memberData: any;
  currentMemberIndex: number;
  existingHouseholdData: HouseholdData[];
  workflowType?: WorkflowType;
}

/**
 * Creates updated household member data for form submission.
 * For EC workflow, also builds the energyCalculator sub-object from form conditions.
 */
export const createHouseholdMemberData = ({
  memberData,
  currentMemberIndex,
  existingHouseholdData,
  workflowType = 'main',
}: CreateHouseholdMemberDataParams): HouseholdData => {
  const incomeStreams = memberData.incomeStreams || [];
  const hasIncome = memberData.hasIncome === 'true' || incomeStreams.length > 0;

  const base = {
    ...memberData,
    id: existingHouseholdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
    frontendId: existingHouseholdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
    birthYear: memberData.birthYear as number,
    birthMonth: memberData.birthMonth as number,
    relationshipToHH: memberData.relationshipToHH as string,
    hasIncome,
    incomeStreams,
  };

  if (workflowType === 'energyCalculator') {
    return {
      ...base,
      conditions: {
        ...memberData.conditions,
        disabled: memberData.conditions.disabled,
      },
      energyCalculator: {
        survivingSpouse: memberData.conditions.survivingSpouse,
        receivesSsi: memberData.receivesSsi === 'true',
        medicalEquipment: memberData.conditions.medicalEquipment,
      },
    } as HouseholdData;
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
