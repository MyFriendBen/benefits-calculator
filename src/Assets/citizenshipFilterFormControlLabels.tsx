import { FormattedMessage } from 'react-intl';
import { HouseholdData } from '../Types/FormData';
import { FormattedMessageType } from '../Types/Questions';
import { calcAge } from './age';

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

// Map for calculated filters based on selected citizenship status
export const filterNestedMap = new Map<CitizenLabelOptions, CitizenLabelOptions[]>([
  ['citizen', []],
  ['non_citizen', []],
  ['gc_5plus', []],
  ['gc_5less', []],
  ['refugee', []],
  ['otherWithWorkPermission', []],
]);

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

// Legacy labels for backwards compatibility (used in dropdown on mobile)
const citizenshipFilterFormControlLabels: Record<CitizenLabelOptions, FormattedMessageType> = {
  citizen: <FormattedMessage id="citizenshipFCtrlLabel-citizen" defaultMessage="U.S. Citizen" />,
  non_citizen: (
    <FormattedMessage
      id="citizenshipFCtrlLabel-non_citizen"
      defaultMessage="Individuals without lawful U.S. presence or citizenship (includes DACA recipients)"
    />
  ),
  gc_5plus: <FormattedMessage id="citizenshipFCtrlLabel-gc_5plus" defaultMessage="Had green card for 5+ years" />,
  gc_5less: (
    <FormattedMessage id="citizenshipFCtrlLabel-gc_5less" defaultMessage="Had green card for less than 5 years" />
  ),
  refugee: (
    <FormattedMessage
      id="citizenshipFCtrlLabel-refugee"
      defaultMessage="Granted refugee or asylee status (special rules or waiting periods may apply)"
    />
  ),
  otherWithWorkPermission: (
    <FormattedMessage
      id="citizenshipFCtrlLabel-other_work_permission"
      defaultMessage="Other lawfully present noncitizens with permission to live or work in the U.S. (other rules may apply)"
    />
  ),
};

export default citizenshipFilterFormControlLabels;
