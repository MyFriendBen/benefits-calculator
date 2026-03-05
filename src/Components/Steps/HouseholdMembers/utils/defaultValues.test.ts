import { createDefaultValues, createEnergyCalculatorDefaultValues, DEFAULT_HEALTH_INSURANCE, DEFAULT_SPECIAL_CONDITIONS, DEFAULT_STUDENT_ELIGIBILITY } from './defaultValues';
import { HouseholdData } from '../../../../Types/FormData';
import { calculateAgeStatus } from '../../../AgeCalculation/AgeCalculation';

jest.mock('../../../AgeCalculation/AgeCalculation', () => ({
  calculateAgeStatus: jest.fn(),
}));

const mockCalculateAgeStatus = calculateAgeStatus as jest.MockedFunction<typeof calculateAgeStatus>;

// Helper to make a member that "has progressed" (has a health insurance selection)
const memberWithHealthIns = (overrides: Partial<HouseholdData> = {}): HouseholdData => ({
  id: '1',
  frontendId: 'f1',
  birthYear: 1990,
  birthMonth: 6,
  relationshipToHH: 'spouse',
  hasIncome: false,
  incomeStreams: [],
  healthInsurance: { none: true, employer: false, private: false, medicaid: false, medicare: false, chp: false, emergency_medicaid: false, family_planning: false, va: false, mass_health: false },
  conditions: { student: false, pregnant: false, blindOrVisuallyImpaired: false, disabled: false, longTermDisability: false },
  ...overrides,
} as unknown as HouseholdData);

// Helper for under-16 age status
const under16AgeStatus = () => ({ age: 10, is16OrOlder: false, isUnder16: true });
// Helper for working-age status
const workingAgeStatus = () => ({ age: 30, is16OrOlder: true, isUnder16: false });

describe('createDefaultValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: working age so income auto-seeds
    mockCalculateAgeStatus.mockReturnValue(workingAgeStatus());
  });

  describe('with no existing data (first visit)', () => {
    it('returns 0 for birthMonth when no data', () => {
      const result = createDefaultValues(undefined);
      expect(result.birthMonth).toBe(0);
    });

    it('returns 0 for birthYear when no data', () => {
      const result = createDefaultValues(undefined);
      expect(result.birthYear).toBe(0);
    });

    it('returns empty string for relationshipToHH when not first member', () => {
      const result = createDefaultValues(undefined, false);
      expect(result.relationshipToHH).toBe('');
    });

    it('sets headOfHousehold for first member', () => {
      const result = createDefaultValues(undefined, true);
      expect(result.relationshipToHH).toBe('headOfHousehold');
    });

    it('returns default health insurance (all false)', () => {
      const result = createDefaultValues(undefined);
      expect(result.healthInsurance).toEqual(DEFAULT_HEALTH_INSURANCE);
    });

    it('returns default conditions (all false)', () => {
      const result = createDefaultValues(undefined);
      expect(result.conditions).toEqual(DEFAULT_SPECIAL_CONDITIONS);
    });

    it('returns default student eligibility (all undefined)', () => {
      const result = createDefaultValues(undefined);
      expect(result.studentEligibility).toEqual(DEFAULT_STUDENT_ELIGIBILITY);
    });

    it('seeds one empty income stream for working-age eligible member on first visit', () => {
      mockCalculateAgeStatus.mockReturnValue(workingAgeStatus());
      // Must pass birthYear and birthMonth so isWorkingAge doesn't short-circuit.
      // No healthInsurance = not yet progressed, so seeding is allowed.
      const workingAgeMember: HouseholdData = {
        id: '1', frontendId: 'f1',
        birthYear: 1990, birthMonth: 6,
        relationshipToHH: '', hasIncome: false, incomeStreams: [],
      } as unknown as HouseholdData;
      const result = createDefaultValues(workingAgeMember);
      expect(result.incomeStreams).toHaveLength(1);
    });

    it('seeds no income stream when there is no birth data at all', () => {
      const result = createDefaultValues(undefined);
      expect(result.incomeStreams).toHaveLength(0);
    });

    it('seeds no income stream for under-16 member', () => {
      mockCalculateAgeStatus.mockReturnValue(under16AgeStatus());
      const youngMember: HouseholdData = {
        id: '1', frontendId: 'f1',
        birthYear: 2018, birthMonth: 6,
        relationshipToHH: '', hasIncome: false, incomeStreams: [],
      } as unknown as HouseholdData;
      const result = createDefaultValues(youngMember);
      expect(result.incomeStreams).toHaveLength(0);
    });
  });

  describe('with existing data (returning visit)', () => {
    it('uses existing birthMonth', () => {
      const member = memberWithHealthIns({ birthMonth: 3 });
      const result = createDefaultValues(member);
      expect(result.birthMonth).toBe(3);
    });

    it('uses existing birthYear', () => {
      const member = memberWithHealthIns({ birthYear: 1985 });
      const result = createDefaultValues(member);
      expect(result.birthYear).toBe(1985);
    });

    it('uses existing relationshipToHH', () => {
      const member = memberWithHealthIns({ relationshipToHH: 'child' });
      const result = createDefaultValues(member);
      expect(result.relationshipToHH).toBe('child');
    });

    it('merges existing health insurance with defaults', () => {
      const member = memberWithHealthIns({ healthInsurance: { none: false, employer: true, private: false, medicaid: false, medicare: false, chp: false, emergency_medicaid: false, family_planning: false, va: false, mass_health: false } });
      const result = createDefaultValues(member);
      expect(result.healthInsurance.employer).toBe(true);
      expect(result.healthInsurance.none).toBe(false);
    });

    it('returns existing income streams', () => {
      const stream = { incomeType: 'employment', incomeSource: 'wages', incomeAmount: '1000', incomeFrequency: 'monthly', hoursPerWeek: '' };
      const member = memberWithHealthIns({ incomeStreams: [stream] as any });
      const result = createDefaultValues(member);
      expect(result.incomeStreams).toHaveLength(1);
      expect(result.incomeStreams[0]).toEqual(stream);
    });

    it('infers conditions.none=true when member has progressed but no conditions set', () => {
      const member = memberWithHealthIns({
        conditions: { student: false, pregnant: false, blindOrVisuallyImpaired: false, disabled: false, longTermDisability: false } as any,
      });
      const result = createDefaultValues(member);
      expect(result.conditions.none).toBe(true);
    });

    it('does not infer none=true when member has a condition set', () => {
      const member = memberWithHealthIns({
        conditions: { student: true, pregnant: false, blindOrVisuallyImpaired: false, disabled: false, longTermDisability: false } as any,
      });
      const result = createDefaultValues(member);
      expect(result.conditions.none).toBe(false);
      expect(result.conditions.student).toBe(true);
    });

    it('does not infer none=true for first visit (not progressed)', () => {
      // No health insurance = not yet progressed, so none should not be inferred
      const member: HouseholdData = {
        id: '1',
        frontendId: 'f1',
        birthYear: 1990,
        birthMonth: 6,
        relationshipToHH: 'spouse',
        hasIncome: false,
        incomeStreams: [],
        conditions: { student: false, pregnant: false, blindOrVisuallyImpaired: false, disabled: false, longTermDisability: false },
      } as unknown as HouseholdData;
      const result = createDefaultValues(member);
      expect(result.conditions.none).toBe(false);
    });

    it('respects empty incomeStreams when member has progressed (user intentionally cleared)', () => {
      mockCalculateAgeStatus.mockReturnValue(workingAgeStatus());
      // No seeding because member has progressed (has health insurance selection) —
      // an empty stream array at this point means the user deliberately removed all income.
      const member = memberWithHealthIns({ incomeStreams: [] });
      const result = createDefaultValues(member);
      expect(result.incomeStreams).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('treats birthMonth of 0 as missing', () => {
      const member = memberWithHealthIns({ birthMonth: 0 });
      const result = createDefaultValues(member);
      expect(result.birthMonth).toBe(0);
    });

    it('treats birthYear of 0 as missing', () => {
      const member = memberWithHealthIns({ birthYear: 0 });
      const result = createDefaultValues(member);
      expect(result.birthYear).toBe(0);
    });
  });
});

describe('createEnergyCalculatorDefaultValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 0 for birthMonth when no data', () => {
    const result = createEnergyCalculatorDefaultValues(undefined, 1);
    expect(result.birthMonth).toBe(0);
  });

  it('returns headOfHousehold for page 1 with no data', () => {
    const result = createEnergyCalculatorDefaultValues(undefined, 1);
    expect(result.relationshipToHH).toBe('headOfHousehold');
  });

  it('returns empty string for relationshipToHH on page 2+ with no data', () => {
    const result = createEnergyCalculatorDefaultValues(undefined, 2);
    expect(result.relationshipToHH).toBe('');
  });

  it('reads survivingSpouse from energyCalculator sub-object', () => {
    const member = {
      energyCalculator: { survivingSpouse: true, receivesSsi: false, medicalEquipment: false },
      conditions: { disabled: false },
    } as any;
    const result = createEnergyCalculatorDefaultValues(member, 2);
    expect(result.conditions.survivingSpouse).toBe(true);
  });

  it('reads disabled from conditions (not from energyCalculator)', () => {
    const member = {
      energyCalculator: { survivingSpouse: false, receivesSsi: false, medicalEquipment: false },
      conditions: { disabled: true },
    } as any;
    const result = createEnergyCalculatorDefaultValues(member, 2);
    expect(result.conditions.disabled).toBe(true);
  });

  it('reads medicalEquipment from energyCalculator sub-object', () => {
    const member = {
      energyCalculator: { survivingSpouse: false, receivesSsi: false, medicalEquipment: true },
      conditions: { disabled: false },
    } as any;
    const result = createEnergyCalculatorDefaultValues(member, 2);
    expect(result.conditions.medicalEquipment).toBe(true);
  });

  it('converts receivesSsi boolean true to string "true"', () => {
    const member = {
      energyCalculator: { survivingSpouse: false, receivesSsi: true, medicalEquipment: false },
      conditions: { disabled: true },
    } as any;
    const result = createEnergyCalculatorDefaultValues(member, 1);
    expect(result.receivesSsi).toBe('true');
  });

  it('converts receivesSsi boolean false to string "false"', () => {
    const member = {
      energyCalculator: { survivingSpouse: false, receivesSsi: false, medicalEquipment: false },
      conditions: { disabled: true },
    } as any;
    const result = createEnergyCalculatorDefaultValues(member, 1);
    expect(result.receivesSsi).toBe('false');
  });

  it('defaults all EC conditions to false when member has no data', () => {
    const result = createEnergyCalculatorDefaultValues(undefined, 2);
    expect(result.conditions).toEqual({ survivingSpouse: false, disabled: false, medicalEquipment: false });
  });

  it('uses existing incomeStreams', () => {
    const stream = { incomeType: 'employment', incomeSource: 'wages', incomeAmount: '500', incomeFrequency: 'monthly', hoursPerWeek: '' };
    const member = { incomeStreams: [stream] } as any;
    const result = createEnergyCalculatorDefaultValues(member, 1);
    expect(result.incomeStreams).toEqual([stream]);
  });

  it('defaults incomeStreams to empty array when missing', () => {
    const result = createEnergyCalculatorDefaultValues(undefined, 1);
    expect(result.incomeStreams).toEqual([]);
  });
});
