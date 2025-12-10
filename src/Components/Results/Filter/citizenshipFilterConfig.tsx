import { FormattedMessage } from 'react-intl';
import { HouseholdData } from '../../../Types/FormData';
import { FormattedMessageType } from '../../../Types/Questions';
import { calcAge } from '../../../Assets/age';

export type CitizenLabelOptions =
  | 'citizen'
  | 'non_citizen'
  | 'gc_5plus'
  | 'gc_5less'
  | 'refugee'
  | 'otherWithWorkPermission';

export type CalculatedCitizenLabel =
  | 'gc_18plus_no5'
  | 'gc_under18_no5'
  | 'otherHealthCareUnder19'
  | 'otherHealthCarePregnant'
  | 'notPregnantOrUnder19ForOmniSalud'
  | 'notPregnantOrUnder19ForEmergencyMedicaid'
  | 'notPregnantForMassHealthLimited'
  | 'notPregnantOrChildForMassHealthLimited'
  | 'otherHealthCareUnder21';

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
  return !member.specialConditions.pregnant && calcAge(member) >= 19;
}

export const calculatedCitizenshipFilters: Record<CalculatedCitizenLabel, CalculatedCitizenshipFilter> = {
  otherHealthCarePregnant: {
    func: (member) => {
      return member.specialConditions.pregnant ?? false;
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
    linkedFilters: ['gc_5less', 'non_citizen', 'otherWithWorkPermission'],
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
      return !(member.specialConditions.pregnant ?? false);
    },
    linkedFilters: ['non_citizen'],
  },
  notPregnantOrChildForMassHealthLimited: {
    func: (member) => {
      const pregnant = member.specialConditions.pregnant ?? false;
      const age = calcAge(member);
      const under21 = age < 21;
      return !pregnant && !under21;
    },
    linkedFilters: ['gc_5less', 'otherWithWorkPermission'],
  },
  otherHealthCareUnder21: {
    func: (member) => {
      return calcAge(member) < 21;
    },
    linkedFilters: ['gc_5less', 'otherWithWorkPermission'],
  },
};

// Button labels and tooltip text for citizenship filters
type CitizenshipFilterConfig = {
  label: FormattedMessageType;
  tooltip: FormattedMessageType;
};

export const citizenshipFilterConfig: Record<CitizenLabelOptions, CitizenshipFilterConfig> = {
  citizen: {
    label: <FormattedMessage id="citizenshipButton-citizen" defaultMessage="U.S. Citizen" />,
    tooltip: (
      <FormattedMessage
        id="citizenshipTooltip-citizen"
        defaultMessage="U.S. citizens by birth or naturalization."
      />
    ),
  },
  gc_5plus: {
    label: <FormattedMessage id="citizenshipButton-gc_5plus" defaultMessage="Green Card 5+" />,
    tooltip: (
      <FormattedMessage
        id="citizenshipTooltip-gc_5plus"
        defaultMessage="Lawful permanent residents who have had their green card for 5 or more years."
      />
    ),
  },
  gc_5less: {
    label: <FormattedMessage id="citizenshipButton-gc_5less" defaultMessage="Green Card <5" />,
    tooltip: (
      <FormattedMessage
        id="citizenshipTooltip-gc_5less"
        defaultMessage="Lawful permanent residents who have had their green card for less than 5 years."
      />
    ),
  },
  refugee: {
    label: <FormattedMessage id="citizenshipButton-refugee" defaultMessage="Refugee/Asylee" />,
    tooltip: (
      <FormattedMessage
        id="citizenshipTooltip-refugee"
        defaultMessage="Individuals granted refugee or asylee status by the U.S. government."
      />
    ),
  },
  otherWithWorkPermission: {
    label: <FormattedMessage id="citizenshipButton-otherLawful" defaultMessage="Other Lawful" />,
    tooltip: (
      <FormattedMessage
        id="citizenshipTooltip-otherLawful"
        defaultMessage="Other lawfully present noncitizens with authorization to live or work in the U.S."
      />
    ),
  },
  non_citizen: {
    label: <FormattedMessage id="citizenshipButton-undocumented" defaultMessage="Undocumented" />,
    tooltip: (
      <FormattedMessage
        id="citizenshipTooltip-undocumented"
        defaultMessage="Individuals without lawful immigration status (includes DACA recipients)."
      />
    ),
  },
};

/**
 * Calculate which derived filters should be active based on citizenship selection and household data
 */
export function calculateDerivedFilters(
  selectedCitizenship: CitizenLabelOptions,
  householdData: HouseholdData[]
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
