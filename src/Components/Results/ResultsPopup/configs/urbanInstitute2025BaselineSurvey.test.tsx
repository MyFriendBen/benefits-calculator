import { getUrbanInstitute2025BaselineSurveyConfig } from './urbanInstitute2025BaselineSurvey';
import { FormData } from '../../../../Types/FormData';

// Mock FormattedMessage since it's used in the config
jest.mock('react-intl', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
}));

describe('urbanInstitute2025BaselineSurvey', () => {
  const createMockFormData = (age: number | null = 25, householdSize: number = 1): FormData => ({
    householdData: Array.from({ length: householdSize }, (_, index) => ({
      age: index === 0 ? age : 30,
      householdMemberID: index,
      student: false,
      studentFullTime: false,
      pregnant: false,
      blindOrDisabled: false,
      conditions: [],
      hasIncome: false,
      incomeStreams: [],
      frontendId: `member-${index}`,
    })),
    immutableReferrer: '',
    expenses: {
      housing: {
        monthlyRent: 0,
        monthlyMortgage: 0,
      },
      utilityAllowanceType: 'standard',
    },
  });

  describe('Eligibility Checks', () => {
    describe('State Eligibility', () => {
      it('returns shouldShow true for Colorado (co)', () => {
        const formData = createMockFormData();
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(true);
      });

      it('returns shouldShow true for North Carolina (nc)', () => {
        const formData = createMockFormData();
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'nc', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(true);
      });

      it('returns shouldShow false for other states', () => {
        const formData = createMockFormData();
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'ca', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('returns shouldShow false when whiteLabel is undefined', () => {
        const formData = createMockFormData();
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, undefined, 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('returns shouldShow false when whiteLabel is empty string', () => {
        const formData = createMockFormData();
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, '', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });
    });

    describe('Age Eligibility', () => {
      it('returns shouldShow true when head of household is exactly 18', () => {
        const formData = createMockFormData(18);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(true);
      });

      it('returns shouldShow true when head of household is over 18', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(true);
      });

      it('returns shouldShow false when head of household is under 18', () => {
        const formData = createMockFormData(17);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('returns shouldShow false when head of household age is null', () => {
        const formData = createMockFormData(null);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('returns shouldShow false when head of household age is undefined', () => {
        // Setting age to undefined to test the undefined case
        const formData = createMockFormData();
        formData.householdData[0].age = undefined as any;
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });
    });

    describe('Household Data Validation', () => {
      it('returns shouldShow false when householdData is empty array', () => {
        const formData: FormData = {
          householdData: [],
          immutableReferrer: '',
          expenses: {
            housing: {
              monthlyRent: 0,
              monthlyMortgage: 0,
            },
            utilityAllowanceType: 'standard',
          },
        };
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('returns shouldShow false when householdData is undefined', () => {
        const formData: FormData = {
          householdData: undefined as any,
          immutableReferrer: '',
          expenses: {
            housing: {
              monthlyRent: 0,
              monthlyMortgage: 0,
            },
            utilityAllowanceType: 'standard',
          },
        };
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('only checks first household member age, not others', () => {
        const formData = createMockFormData(25, 3);
        // Set second member age to under 18
        formData.householdData[1].age = 10;
        formData.householdData[2].age = 5;

        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(true);
      });
    });

    describe('Combined Eligibility', () => {
      it('returns shouldShow true when all criteria met', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(true);
      });

      it('returns shouldShow false when state is ineligible even if age is valid', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'ny', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });

      it('returns shouldShow false when age is ineligible even if state is valid', () => {
        const formData = createMockFormData(17);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

        expect(config.shouldShow()).toBe(false);
      });
    });
  });

  describe('Survey URL Generation', () => {
    it('generates English URL with screener ID', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid-123');

      expect(config.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?screenerid=test-uuid-123'
      );
    });

    it('generates Spanish URL with screener ID when locale is es', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'es', 'test-uuid-456');

      expect(config.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?Q_Language=ES&screenerid=test-uuid-456'
      );
    });

    it('generates URL with empty screener ID when uuid is undefined', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', undefined);

      expect(config.linkUrl).toBe('https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?screenerid=');
    });

    it('generates URL with empty screener ID when uuid is empty string', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', '');

      expect(config.linkUrl).toBe('https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?screenerid=');
    });

    it('generates English URL for non-Spanish locales', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'fr', 'test-uuid');

      expect(config.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?screenerid=test-uuid'
      );
    });
  });

  describe('Config Structure', () => {
    it('returns config with all required properties', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(config).toHaveProperty('shouldShow');
      expect(config).toHaveProperty('message');
      expect(config).toHaveProperty('linkUrl');
      expect(config).toHaveProperty('linkText');
      expect(config).toHaveProperty('minimizedText');
      expect(config).toHaveProperty('startMinimized');
    });

    it('returns shouldShow as a function', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(typeof config.shouldShow).toBe('function');
    });

    it('sets startMinimized to true', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(config.startMinimized).toBe(true);
    });

    it('includes FormattedMessage components for text fields', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      // These will be mocked strings due to our mock
      expect(config.message).toBeDefined();
      expect(config.linkText).toBeDefined();
      expect(config.minimizedText).toBeDefined();
    });
  });

  describe('shouldShow Function Behavior', () => {
    it('evaluates shouldShow with current formData and whiteLabel', () => {
      const formData = createMockFormData(25);
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      // First call should return true
      expect(config.shouldShow()).toBe(true);

      // Mutate the formData object to set age to 17
      formData.householdData[0].age = 17;

      // The shouldShow function reads from the current formData object, so mutating age to 17
      // should cause it to return false (since 17 < 18)
      expect(config.shouldShow()).toBe(false);
    });

    it('can be called multiple times', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(config.shouldShow()).toBe(true);
      expect(config.shouldShow()).toBe(true);
      expect(config.shouldShow()).toBe(true);
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('handles large age values', () => {
      const formData = createMockFormData(120);
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(config.shouldShow()).toBe(true);
    });

    it('handles zero age', () => {
      const formData = createMockFormData(0);
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(config.shouldShow()).toBe(false);
    });

    it('handles negative age', () => {
      const formData = createMockFormData(-5);
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(config.shouldShow()).toBe(false);
    });

    it('handles very long UUID strings', () => {
      const formData = createMockFormData();
      const longUuid = 'a'.repeat(1000);
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', longUuid);

      expect(config.linkUrl).toContain(`screenerid=${longUuid}`);
    });

    it('handles special characters in UUID', () => {
      const formData = createMockFormData();
      const specialUuid = 'uuid-with-special-chars-!@#$%';
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', specialUuid);

      expect(config.linkUrl).toContain(`screenerid=${specialUuid}`);
    });

    it('handles case-sensitive state codes', () => {
      const formData = createMockFormData();
      const configUpperCO = getUrbanInstitute2025BaselineSurveyConfig(formData, 'CO', 'en', 'test-uuid');
      const configUpperNC = getUrbanInstitute2025BaselineSurveyConfig(formData, 'NC', 'en', 'test-uuid');

      // Our implementation is case-sensitive, so uppercase should fail
      expect(configUpperCO.shouldShow()).toBe(false);
      expect(configUpperNC.shouldShow()).toBe(false);
    });

    it('handles case-sensitive locale', () => {
      const formData = createMockFormData();
      const configUpperES = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'ES', 'test-uuid');

      // Locale check is case-sensitive
      expect(configUpperES.linkUrl).not.toContain('Q_Language=ES');
    });
  });

  describe('Data Immutability', () => {
    it('does not modify input formData', () => {
      const formData = createMockFormData(25);
      const originalFormData = JSON.parse(JSON.stringify(formData));

      getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(formData).toEqual(originalFormData);
    });

    it('creates independent configs for different calls', () => {
      const formData1 = createMockFormData(25);
      const formData2 = createMockFormData(30);

      const config1 = getUrbanInstitute2025BaselineSurveyConfig(formData1, 'co', 'en', 'uuid-1');
      const config2 = getUrbanInstitute2025BaselineSurveyConfig(formData2, 'nc', 'es', 'uuid-2');

      expect(config1.linkUrl).not.toBe(config2.linkUrl);
      expect(config1.linkUrl).toContain('uuid-1');
      expect(config2.linkUrl).toContain('uuid-2');
      expect(config2.linkUrl).toContain('Q_Language=ES');
    });
  });
});
