import { createHouseholdMemberSchema, createEnergyCalculatorHouseholdMemberSchema } from './schema';
import { getCurrentMonthYear, MAX_AGE } from '../../../../Assets/age.tsx';

// Mock intl with inline formatMessage for all validation messages
const mockFormatMessage = jest.fn((params: { id: string; defaultMessage?: string }) => params.defaultMessage ?? params.id);
const mockIntl = { formatMessage: mockFormatMessage } as any;

const { CURRENT_YEAR, CURRENT_MONTH } = getCurrentMonthYear();

const validMainData = {
  birthMonth: 6,
  birthYear: 1990,
  relationshipToHH: 'spouse',
  healthInsurance: { none: true, employer: false, private: false, medicaid: false, medicare: false, chp: false, emergency_medicaid: false, family_planning: false, va: false, mass_health: false },
  conditions: { student: false, pregnant: false, blindOrVisuallyImpaired: false, disabled: false, longTermDisability: false },
  studentEligibility: { studentFullTime: undefined, studentJobTrainingProgram: undefined, studentHasWorkStudy: undefined, studentWorks20PlusHrs: undefined },
  hasIncome: 'false',
  incomeStreams: [],
};

const validEcData = {
  birthMonth: 6,
  birthYear: 1990,
  conditions: { survivingSpouse: false, disabled: false, medicalEquipment: false },
  receivesSsi: 'false' as const,
  relationshipToHH: 'spouse',
  hasIncome: 'false',
  incomeStreams: [],
};

// ============================================================================
// createHouseholdMemberSchema — main workflow
// ============================================================================

describe('createHouseholdMemberSchema (main)', () => {
  const schema = createHouseholdMemberSchema(mockIntl, 2);

  describe('valid data', () => {
    it('accepts fully valid data', () => {
      expect(schema.safeParse(validMainData).success).toBe(true);
    });

    it('accepts no income', () => {
      const data = { ...validMainData, hasIncome: 'false', incomeStreams: [] };
      expect(schema.safeParse(data).success).toBe(true);
    });

    it('accepts multiple health insurance selections', () => {
      const data = { ...validMainData, healthInsurance: { ...validMainData.healthInsurance, none: false, employer: true, medicaid: true } };
      expect(schema.safeParse(data).success).toBe(true);
    });
  });

  describe('birthMonth validation', () => {
    it('rejects birthMonth of 0', () => {
      const result = schema.safeParse({ ...validMainData, birthMonth: 0 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('birthMonth'))).toBe(true);
    });

    it('rejects birthMonth of 13', () => {
      const result = schema.safeParse({ ...validMainData, birthMonth: 13 });
      expect(result.success).toBe(false);
    });

    it('accepts all valid months 1-12', () => {
      for (let m = 1; m <= 12; m++) {
        const result = schema.safeParse({ ...validMainData, birthMonth: m });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('birthYear validation', () => {
    it('rejects birth year too far in the past', () => {
      const result = schema.safeParse({ ...validMainData, birthYear: CURRENT_YEAR - MAX_AGE - 1 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('birthYear'))).toBe(true);
    });

    it('rejects birth year in the future', () => {
      const result = schema.safeParse({ ...validMainData, birthYear: CURRENT_YEAR + 1 });
      expect(result.success).toBe(false);
    });

    it('accepts current year', () => {
      const data = { ...validMainData, birthYear: CURRENT_YEAR, birthMonth: 1 };
      // May fail future-month check from superRefine but year itself is valid
      const result = schema.safeParse(data);
      // We just check it doesn't fail on year bound; it might fail on month
      const yearErrors = result.error?.issues.filter(i => i.path.includes('birthYear') && !i.path.includes('birthMonth'));
      expect(yearErrors ?? []).toHaveLength(0);
    });

    it('coerces string birth year', () => {
      const result = schema.safeParse({ ...validMainData, birthYear: '1990' as any });
      expect(result.success).toBe(true);
    });
  });

  describe('relationshipToHH validation', () => {
    it('rejects empty relationship', () => {
      const result = schema.safeParse({ ...validMainData, relationshipToHH: '' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('relationshipToHH'))).toBe(true);
    });

    it('accepts any non-empty string', () => {
      expect(schema.safeParse({ ...validMainData, relationshipToHH: 'child' }).success).toBe(true);
    });
  });

  describe('healthInsurance validation', () => {
    it('rejects when no health insurance option is selected', () => {
      const noSelection = { none: false, employer: false, private: false, medicaid: false, medicare: false, chp: false, emergency_medicaid: false, family_planning: false, va: false, mass_health: false };
      const result = schema.safeParse({ ...validMainData, healthInsurance: noSelection });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('healthInsurance'))).toBe(true);
    });

    it('rejects when none=true and another option is also true', () => {
      const conflictSelection = { none: true, employer: true, private: false, medicaid: false, medicare: false, chp: false, emergency_medicaid: false, family_planning: false, va: false, mass_health: false };
      const result = schema.safeParse({ ...validMainData, healthInsurance: conflictSelection });
      expect(result.success).toBe(false);
    });

    it('accepts none=true alone', () => {
      const result = schema.safeParse(validMainData);
      expect(result.success).toBe(true);
    });
  });

  describe('conditions validation', () => {
    it('accepts all conditions false (optional section)', () => {
      const result = schema.safeParse(validMainData);
      expect(result.success).toBe(true);
    });

    it('accepts any combination of non-student conditions', () => {
      const data = { ...validMainData, conditions: { student: false, pregnant: true, blindOrVisuallyImpaired: true, disabled: false, longTermDisability: false } };
      expect(schema.safeParse(data).success).toBe(true);
    });
  });

  describe('student eligibility validation', () => {
    it('requires all 4 student questions answered when student=true', () => {
      const data = {
        ...validMainData,
        conditions: { ...validMainData.conditions, student: true },
        studentEligibility: { studentFullTime: undefined, studentJobTrainingProgram: undefined, studentHasWorkStudy: undefined, studentWorks20PlusHrs: undefined },
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(4);
      expect(result.error?.issues.every(i => i.path.includes('studentEligibility'))).toBe(true);
    });

    it('passes when student=true and all 4 questions answered', () => {
      const data = {
        ...validMainData,
        conditions: { ...validMainData.conditions, student: true },
        studentEligibility: { studentFullTime: true, studentJobTrainingProgram: false, studentHasWorkStudy: false, studentWorks20PlusHrs: true },
      };
      expect(schema.safeParse(data).success).toBe(true);
    });

    it('does not require student questions when student=false', () => {
      // All undefined should still pass
      const result = schema.safeParse(validMainData);
      expect(result.success).toBe(true);
    });

    it('flags individual missing questions when only some are answered', () => {
      const data = {
        ...validMainData,
        conditions: { ...validMainData.conditions, student: true },
        studentEligibility: { studentFullTime: true, studentJobTrainingProgram: undefined, studentHasWorkStudy: true, studentWorks20PlusHrs: undefined },
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      const paths = result.error?.issues.map(i => i.path[i.path.length - 1]);
      expect(paths).toContain('studentJobTrainingProgram');
      expect(paths).toContain('studentWorks20PlusHrs');
      expect(paths).not.toContain('studentFullTime');
      expect(paths).not.toContain('studentHasWorkStudy');
    });
  });

  describe('income validation', () => {
    it('rejects invalid hasIncome value', () => {
      const result = schema.safeParse({ ...validMainData, hasIncome: 'yes' });
      expect(result.success).toBe(false);
    });

    it('accepts hasIncome "true" or "false"', () => {
      expect(schema.safeParse({ ...validMainData, hasIncome: 'true', incomeStreams: [{ incomeStreamName: 'wages', incomeFrequency: 'monthly', hoursPerWeek: '', incomeAmount: '1000' }] }).success).toBe(true);
      expect(schema.safeParse({ ...validMainData, hasIncome: 'false' }).success).toBe(true);
    });

    it('rejects income stream with missing incomeStreamName', () => {
      const result = schema.safeParse({
        ...validMainData,
        hasIncome: 'true',
        incomeStreams: [{ incomeStreamName: '', incomeFrequency: 'monthly', hoursPerWeek: '', incomeAmount: '1000' }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('incomeStreamName'))).toBe(true);
    });

    it('rejects income stream with zero amount', () => {
      const result = schema.safeParse({
        ...validMainData,
        hasIncome: 'true',
        incomeStreams: [{ incomeStreamName: 'wages', incomeFrequency: 'monthly', hoursPerWeek: '', incomeAmount: '0' }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('incomeAmount'))).toBe(true);
    });

    it('rejects hourly income without hoursPerWeek', () => {
      const result = schema.safeParse({
        ...validMainData,
        hasIncome: 'true',
        incomeStreams: [{ incomeStreamName: 'wages', incomeFrequency: 'hourly', hoursPerWeek: '', incomeAmount: '15' }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('hoursPerWeek'))).toBe(true);
    });

    it('accepts hourly income with hoursPerWeek set', () => {
      const result = schema.safeParse({
        ...validMainData,
        hasIncome: 'true',
        incomeStreams: [{ incomeStreamName: 'wages', incomeFrequency: 'hourly', hoursPerWeek: '40', incomeAmount: '15' }],
      });
      expect(result.success).toBe(true);
    });

    it('validates multiple income streams independently', () => {
      const result = schema.safeParse({
        ...validMainData,
        hasIncome: 'true',
        incomeStreams: [
          { incomeStreamName: 'wages', incomeFrequency: 'monthly', hoursPerWeek: '', incomeAmount: '1000' },
          { incomeStreamName: '', incomeFrequency: 'monthly', hoursPerWeek: '', incomeAmount: '500' },
        ],
      });
      expect(result.success).toBe(false);
      // Error should be on the second stream
      expect(result.error?.issues.some(i => i.path[1] === 1 && i.path.includes('incomeStreamName'))).toBe(true);
    });
  });
});

// ============================================================================
// createEnergyCalculatorHouseholdMemberSchema — EC workflow
// ============================================================================

describe('createEnergyCalculatorHouseholdMemberSchema', () => {
  const relationshipOptions = { spouse: 'Spouse', child: 'Child', parent: 'Parent' };
  const schema = createEnergyCalculatorHouseholdMemberSchema(mockIntl, 2, relationshipOptions);

  describe('valid data', () => {
    it('accepts fully valid data', () => {
      expect(schema.safeParse(validEcData).success).toBe(true);
    });
  });

  describe('birthMonth/birthYear validation', () => {
    it('rejects future birth month in current year', () => {
      const futureMonth = CURRENT_MONTH === 12 ? 1 : CURRENT_MONTH + 1;
      // Only testable if CURRENT_MONTH < 12
      if (CURRENT_MONTH < 12) {
        const result = schema.safeParse({ ...validEcData, birthYear: CURRENT_YEAR, birthMonth: futureMonth });
        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.path.includes('birthMonth'))).toBe(true);
      }
    });

    it('accepts current month in current year', () => {
      const result = schema.safeParse({ ...validEcData, birthYear: CURRENT_YEAR, birthMonth: CURRENT_MONTH });
      expect(result.success).toBe(true);
    });

    it('does not validate future month check for past years', () => {
      const result = schema.safeParse({ ...validEcData, birthYear: 1990, birthMonth: 12 });
      expect(result.success).toBe(true);
    });
  });

  describe('relationshipToHH validation', () => {
    it('rejects relationship not in options for page > 1', () => {
      const result = schema.safeParse({ ...validEcData, relationshipToHH: 'unknownRelationship' });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(i => i.path.includes('relationshipToHH'))).toBe(true);
    });

    it('accepts relationship in options', () => {
      const result = schema.safeParse({ ...validEcData, relationshipToHH: 'spouse' });
      expect(result.success).toBe(true);
    });

    it('accepts any relationship for page 1 (head of household)', () => {
      const page1Schema = createEnergyCalculatorHouseholdMemberSchema(mockIntl, 1, relationshipOptions);
      const result = page1Schema.safeParse({ ...validEcData, relationshipToHH: 'headOfHousehold' });
      expect(result.success).toBe(true);
    });
  });

  describe('conditions validation', () => {
    it('accepts all conditions false', () => {
      expect(schema.safeParse(validEcData).success).toBe(true);
    });

    it('accepts disabled=true (which triggers receivesSsi)', () => {
      const result = schema.safeParse({ ...validEcData, conditions: { ...validEcData.conditions, disabled: true }, receivesSsi: 'true' });
      expect(result.success).toBe(true);
    });
  });

  describe('receivesSsi validation', () => {
    it('accepts "true" and "false"', () => {
      expect(schema.safeParse({ ...validEcData, receivesSsi: 'true' }).success).toBe(true);
      expect(schema.safeParse({ ...validEcData, receivesSsi: 'false' }).success).toBe(true);
    });

    it('accepts undefined receivesSsi (optional)', () => {
      const { receivesSsi: _, ...dataWithoutSsi } = validEcData;
      expect(schema.safeParse(dataWithoutSsi).success).toBe(true);
    });

    it('rejects invalid receivesSsi value', () => {
      const result = schema.safeParse({ ...validEcData, receivesSsi: 'yes' as any });
      expect(result.success).toBe(false);
    });
  });

  describe('no health insurance or student eligibility fields', () => {
    it('ignores extra healthInsurance field (strips unknown keys)', () => {
      const result = schema.safeParse({ ...validEcData, healthInsurance: { none: true } });
      // Should pass — EC schema doesn't have healthInsurance field so it's stripped
      expect(result.success).toBe(true);
    });
  });
});
