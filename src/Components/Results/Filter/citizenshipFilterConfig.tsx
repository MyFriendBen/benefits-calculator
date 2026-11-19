import { useConfig } from '../../Config/configHook';
import { HouseholdData } from '../../../Types/FormData';
import { FormattedMessageType } from '../../../Types/Questions';
import { calcAge } from '../../../Assets/age';

/**
 * The legal statuses a household picks. benefits-api serves their order, labels and tooltips
 * (`legal_status_options`); this list exists because the calculated statuses below follow them,
 * and `apiAllowedValues.test.ts` pins it to the API's.
 */
export const CITIZEN_LABEL_OPTIONS = [
  'citizen',
  'non_citizen',
  'gc_5plus',
  'gc_5less',
  'refugee',
  'otherWithWorkPermission',
] as const;
export type CitizenLabelOptions = (typeof CITIZEN_LABEL_OPTIONS)[number];

export type CalculatedCitizenLabel =
  | 'gc_18plus_no5'
  | 'gc_under18_no5'
  | 'otherHealthCareUnder19'
  | 'otherHealthCarePregnant'
  | 'notPregnantOrUnder19ForOmniSalud'
  | 'notPregnantOrUnder19ForEmergencyMedicaid'
  | 'notPregnantForMassHealthLimited'
  | 'notPregnantOrChildForMassHealthLimited'
  | 'otherHealthCareUnder21'
  | 'lawfulHealthCarePregnant'
  | 'lawfulHealthCareUnder19';

export type CitizenLabels = CitizenLabelOptions | CalculatedCitizenLabel;

/**
 * Single-select filter state model
 */
export type FilterState = {
  selectedCitizenship: CitizenLabelOptions;
  calculatedFilters: Set<CalculatedCitizenLabel>;
};

type CalculatedCitizenshipFilter = {
  func: (member: HouseholdData) => boolean;
  linkedFilters: CitizenLabelOptions[];
};

function notPregnantOrUnder19(member: HouseholdData) {
  return !member.conditions.pregnant && calcAge(member) >= 19;
}

export const calculatedCitizenshipFilters: Record<CalculatedCitizenLabel, CalculatedCitizenshipFilter> = {
  otherHealthCarePregnant: {
    func: (member) => {
      return member.conditions.pregnant ?? false;
    },
    linkedFilters: ['non_citizen', 'refugee', 'gc_5plus', 'gc_5less', 'otherWithWorkPermission'],
  },
  otherHealthCareUnder19: {
    func: (member) => {
      return calcAge(member) < 19;
    },
    linkedFilters: ['non_citizen', 'refugee', 'gc_5plus', 'gc_5less', 'otherWithWorkPermission'],
  },
  notPregnantOrUnder19ForOmniSalud: {
    func: notPregnantOrUnder19,
    linkedFilters: ['non_citizen'],
  },
  notPregnantOrUnder19ForEmergencyMedicaid: {
    func: notPregnantOrUnder19,
    linkedFilters: ['gc_5less', 'non_citizen', 'otherWithWorkPermission', 'refugee'],
  },
  gc_18plus_no5: {
    func: (member) => {
      return calcAge(member) >= 18;
    },
    linkedFilters: ['gc_5less'],
  },
  gc_under18_no5: {
    func: (member) => {
      return calcAge(member) < 18;
    },
    linkedFilters: ['gc_5less'],
  },
  notPregnantForMassHealthLimited: {
    func: (member) => {
      return !(member.conditions.pregnant ?? false);
    },
    linkedFilters: ['non_citizen'],
  },
  notPregnantOrChildForMassHealthLimited: {
    func: (member) => {
      const pregnant = member.conditions.pregnant ?? false;
      const age = calcAge(member);
      const under21 = age < 21;
      return !pregnant && !under21;
    },
    linkedFilters: ['gc_5less', 'otherWithWorkPermission', 'refugee'],
  },
  otherHealthCareUnder21: {
    func: (member) => {
      return calcAge(member) < 21;
    },
    linkedFilters: ['gc_5less', 'otherWithWorkPermission', 'refugee'],
  },
  lawfulHealthCarePregnant: {
    func: (member) => member.conditions.pregnant ?? false,
    linkedFilters: ['gc_5less', 'otherWithWorkPermission', 'refugee'],
  },
  lawfulHealthCareUnder19: {
    func: (member) => calcAge(member) < 19,
    linkedFilters: ['gc_5less', 'otherWithWorkPermission', 'refugee'],
  },
};

export type LegalStatusOption = {
  label: FormattedMessageType;
  tooltip: FormattedMessageType;
};

/** The legal statuses a household picks, in button order, as benefits-api serves them. */
export function useLegalStatusOptions(): [CitizenLabelOptions, LegalStatusOption][] {
  const options = useConfig<Record<string, LegalStatusOption>>('legal_status_options', {});
  return Object.entries(options) as [CitizenLabelOptions, LegalStatusOption][];
}

/**
 * Calculate which derived filters should be active based on citizenship selection and household data
 */
export function calculateDerivedFilters(
  selectedCitizenship: CitizenLabelOptions,
  householdData: HouseholdData[],
): Set<CalculatedCitizenLabel> {
  const activeFilters = new Set<CalculatedCitizenLabel>();

  // Check each calculated filter to see if it applies
  for (const [filterName, calculator] of Object.entries(calculatedCitizenshipFilters)) {
    const typedFilterName = filterName as CalculatedCitizenLabel;

    // Only activate if this filter is linked to the selected citizenship
    if (!calculator.linkedFilters.includes(selectedCitizenship)) {
      continue;
    }

    // Only activate if at least one household member meets the condition
    if (householdData.some(calculator.func)) {
      activeFilters.add(typedFilterName);
    }
  }

  return activeFilters;
}

/**
 * Create initial filter state (defaults to 'citizen' with no derived filters)
 */
export function createInitialFilterState(): FilterState {
  return {
    selectedCitizenship: 'citizen',
    calculatedFilters: new Set(),
  };
}
