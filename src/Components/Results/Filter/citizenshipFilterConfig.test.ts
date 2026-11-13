import filterProgramsGenerator from './filterPrograms';
import { calculateDerivedFilters, CitizenLabelOptions, FilterState } from './citizenshipFilterConfig';
import { createFormData, createMemberEligibility, createProgram } from '../testHelpers';
import { FormData, HouseholdData } from '../../../Types/FormData';
import { Program } from '../../../Types/Results';

if (!global.structuredClone) {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

jest.mock('../FormattedValue', () => ({
  programValue: (program: Program) =>
    program.household_value + program.members.reduce((total, member) => total + member.value, 0),
}));

jest.mock('../Results', () => ({
  findMemberEligibilityMember: (formData: FormData, memberEligibility: { frontend_id: string }) =>
    formData.householdData.find(({ frontendId }) => frontendId === memberEligibility.frontend_id),
}));

const member = (frontendId: string, age: number, pregnant = false) =>
  ({ frontendId, age, conditions: { pregnant } } as unknown as HouseholdData);

const ADULT = member('adult', 35);
const PREGNANT_ADULT = member('pregnant', 28, true);
const CHILD = member('child', 15);
const YOUNG_ADULT = member('young_adult', 20);
const EIGHTEEN = member('eighteen', 18);
const NINETEEN = member('nineteen', 19);

const filterStateFor = (selectedCitizenship: CitizenLabelOptions, householdData: HouseholdData[]): FilterState => ({
  selectedCitizenship,
  calculatedFilters: calculateDerivedFilters(selectedCitizenship, householdData),
});

const programFor = (legalStatus: string[], householdData: HouseholdData[]) =>
  createProgram({
    legal_status_required: legalStatus,
    members: householdData.map(({ frontendId }) => createMemberEligibility(frontendId, true, 100)),
  });

const filterFor = (selectedCitizenship: CitizenLabelOptions, householdData: HouseholdData[], program: Program) => {
  const formData = createFormData({ householdData });
  const filtered = filterProgramsGenerator(
    formData,
    filterStateFor(selectedCitizenship, householdData),
    false,
  )([program]);
  return filtered[0];
};

const memberValues = (program: Program | undefined) =>
  Object.fromEntries((program?.members ?? []).map(({ frontend_id, value }) => [frontend_id, value]));

// Legal statuses as configured on the programs these labels serve.
const MASS_HEALTH = ['citizen', 'gc_5plus', 'otherHealthCarePregnant', 'otherHealthCareUnder21'];
const MASS_HEALTH_LIMITED = ['notPregnantForMassHealthLimited', 'notPregnantOrChildForMassHealthLimited'];
const NC_MEDICAID = ['citizen', 'gc_5plus', 'gc_under18_no5', 'lawfulHealthCarePregnant', 'lawfulHealthCareUnder19'];
const NC_EMERGENCY_MEDICAID = ['non_citizen'];
const CO_EMERGENCY_MEDICAID = ['notPregnantOrUnder19ForEmergencyMedicaid'];
const CO_MEDICAID = ['citizen', 'gc_5plus', 'gc_under18_no5', 'otherHealthCarePregnant', 'otherHealthCareUnder19'];

describe('calculateDerivedFilters for refugee', () => {
  it('activates the under-21 label for a household with a child', () => {
    expect(calculateDerivedFilters('refugee', [ADULT, CHILD]).has('otherHealthCareUnder21')).toBe(true);
  });

  it('activates the adults-only emergency labels for a non-pregnant adult', () => {
    const filters = calculateDerivedFilters('refugee', [ADULT]);
    expect(filters.has('notPregnantOrUnder19ForEmergencyMedicaid')).toBe(true);
    expect(filters.has('notPregnantOrChildForMassHealthLimited')).toBe(true);
  });

  it('does not activate labels reserved for undocumented households', () => {
    const filters = calculateDerivedFilters('refugee', [ADULT, CHILD]);
    expect(filters.has('notPregnantOrUnder19ForOmniSalud')).toBe(false);
    expect(filters.has('notPregnantForMassHealthLimited')).toBe(false);
  });
});

describe('refugee households after the Oct 1, 2026 Medicaid change', () => {
  it('MassHealth keeps refugee children under 21 and drops the adults', () => {
    const household = [ADULT, YOUNG_ADULT, CHILD];
    const result = filterFor('refugee', household, programFor(MASS_HEALTH, household));
    expect(memberValues(result)).toEqual({ adult: 0, young_adult: 100, child: 100 });
  });

  it('MassHealth Limited goes to refugee adults only, not children or pregnant members', () => {
    const household = [ADULT, PREGNANT_ADULT, YOUNG_ADULT, CHILD];
    const result = filterFor('refugee', household, programFor(MASS_HEALTH_LIMITED, household));
    expect(memberValues(result)).toEqual({ adult: 100, pregnant: 0, young_adult: 0, child: 0 });
  });

  it('NC Medicaid shows to refugee children', () => {
    const household = [ADULT, CHILD];
    const result = filterFor('refugee', household, programFor(NC_MEDICAID, household));
    expect(memberValues(result)).toEqual({ adult: 0, child: 100 });
  });

  it('CO Emergency Medicaid goes to refugee adults, not children or pregnant members', () => {
    const household = [ADULT, PREGNANT_ADULT, CHILD];
    const result = filterFor('refugee', household, programFor(CO_EMERGENCY_MEDICAID, household));
    expect(memberValues(result)).toEqual({ adult: 100, pregnant: 0, child: 0 });
  });

  it('CO Medicaid stays hidden from an adult-only, non-pregnant refugee household', () => {
    const household = [ADULT];
    expect(filterFor('refugee', household, programFor(CO_MEDICAID, household))).toBeUndefined();
  });

  it('MassHealth Limited stays hidden from a refugee household of only children', () => {
    const household = [CHILD];
    expect(filterFor('refugee', household, programFor(MASS_HEALTH_LIMITED, household))).toBeUndefined();
  });
});

describe('NC Medicaid for lawfully present pregnant people and children under 19', () => {
  const LAWFULLY_PRESENT: CitizenLabelOptions[] = ['gc_5less', 'otherWithWorkPermission', 'refugee'];

  it('does not activate the lawful-only labels for an undocumented household', () => {
    const filters = calculateDerivedFilters('non_citizen', [PREGNANT_ADULT, CHILD]);
    expect(filters.has('lawfulHealthCarePregnant')).toBe(false);
    expect(filters.has('lawfulHealthCareUnder19')).toBe(false);
  });

  it('hides NC Medicaid from an undocumented household with a pregnant member and a child', () => {
    const household = [PREGNANT_ADULT, CHILD];
    expect(filterFor('non_citizen', household, programFor(NC_MEDICAID, household))).toBeUndefined();
  });

  it('shows NC Emergency Medicaid to the same undocumented household', () => {
    const household = [PREGNANT_ADULT, CHILD];
    const result = filterFor('non_citizen', household, programFor(NC_EMERGENCY_MEDICAID, household));
    expect(memberValues(result)).toEqual({ pregnant: 100, child: 100 });
  });

  it.each(LAWFULLY_PRESENT)(
    '%s: NC Medicaid goes to pregnant members and children, not other adults',
    (status: CitizenLabelOptions) => {
      const household = [ADULT, PREGNANT_ADULT, CHILD];
      const result = filterFor(status, household, programFor(NC_MEDICAID, household));
      expect(memberValues(result)).toEqual({ adult: 0, pregnant: 100, child: 100 });
    },
  );

  it.each(LAWFULLY_PRESENT)('%s: the child age limit is 19', (status: CitizenLabelOptions) => {
    const household = [EIGHTEEN, NINETEEN];
    const result = filterFor(status, household, programFor(NC_MEDICAID, household));
    expect(memberValues(result)).toEqual({ eighteen: 100, nineteen: 0 });
  });

  it.each(LAWFULLY_PRESENT)('%s: NC Emergency Medicaid stays hidden', (status: CitizenLabelOptions) => {
    const household = [PREGNANT_ADULT, CHILD];
    expect(filterFor(status, household, programFor(NC_EMERGENCY_MEDICAID, household))).toBeUndefined();
  });
});

describe('unchanged behavior for other statuses', () => {
  it('CO Medicaid still shows undocumented pregnant members and children', () => {
    const household = [ADULT, PREGNANT_ADULT, CHILD];
    const result = filterFor('non_citizen', household, programFor(CO_MEDICAID, household));
    expect(memberValues(result)).toEqual({ adult: 0, pregnant: 100, child: 100 });
  });

  it('NC Medicaid still shows every member of a citizen household', () => {
    const household = [ADULT, PREGNANT_ADULT, CHILD];
    const result = filterFor('citizen', household, programFor(NC_MEDICAID, household));
    expect(memberValues(result)).toEqual({ adult: 100, pregnant: 100, child: 100 });
  });

  it('MassHealth still hides from undocumented households with a child', () => {
    const household = [ADULT, CHILD];
    expect(filterFor('non_citizen', household, programFor(MASS_HEALTH, household))).toBeUndefined();
  });

  it('CO Emergency Medicaid still shows undocumented adults only', () => {
    const household = [ADULT, CHILD];
    const result = filterFor('non_citizen', household, programFor(CO_EMERGENCY_MEDICAID, household));
    expect(memberValues(result)).toEqual({ adult: 100, child: 0 });
  });

  it('a citizen household is unaffected by the derived labels', () => {
    const household = [ADULT, CHILD];
    const result = filterFor('citizen', household, programFor(MASS_HEALTH, household));
    expect(memberValues(result)).toEqual({ adult: 100, child: 100 });
  });
});
