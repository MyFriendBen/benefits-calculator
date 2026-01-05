import { getUrbanInstitute2025BaselineSurveyConfig } from './urbanInstitute2025BaselineSurvey';
import { FormData } from '../../../../Types/FormData';

jest.mock('react-intl', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
}));

describe('urbanInstitute2025BaselineSurvey', () => {
  const createMockFormData = (age: number | null = 25, householdSize: number = 1): FormData =>
    ({
      householdData: Array.from({ length: householdSize }, (_, index) => ({
        id: index,
        frontendId: `member-${index}`,
        age: index === 0 ? age : 30,
        relationshipToHH: index === 0 ? 'headOfHousehold' : 'child',
        conditions: {},
        hasIncome: false,
        incomeStreams: [],
      })),
      immutableReferrer: '',
      expenses: [],
    }) as unknown as FormData;

  describe('shouldShow eligibility', () => {
    describe('eligible users', () => {
      it('returns true for eligible CO user', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(true);
      });

      it('returns true for eligible NC user', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'nc', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(true);
      });

      it('returns true for Spanish locale', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'es', 'test-uuid');
        expect(config.shouldShow()).toBe(true);
      });

      it('returns true for locale with region code (en-US, es-MX)', () => {
        const formData = createMockFormData(25);
        expect(getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en-US', 'test-uuid').shouldShow()).toBe(true);
        expect(getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'es-MX', 'test-uuid').shouldShow()).toBe(true);
      });

      it('returns true when head of household is exactly 18', () => {
        const formData = createMockFormData(18);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(true);
      });
    });

    describe('ineligible users', () => {
      it('returns false for ineligible state', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'ca', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(false);
      });

      it('returns false when whiteLabel is undefined', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, undefined, 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(false);
      });

      it('returns false for ineligible locale', () => {
        const formData = createMockFormData(25);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'fr', 'test-uuid');
        expect(config.shouldShow()).toBe(false);
      });

      it('returns false when head of household is under 18', () => {
        const formData = createMockFormData(17);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(false);
      });

      it('returns false when head of household age is null', () => {
        const formData = createMockFormData(null);
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(false);
      });

      it('returns false when householdData is empty', () => {
        const formData = { householdData: [], expenses: [] } as unknown as FormData;
        const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');
        expect(config.shouldShow()).toBe(false);
      });
    });
  });

  describe('survey URL generation', () => {
    it('generates English URL with screener ID', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');
      expect(config.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?screenerid=test-uuid',
      );
    });

    it('generates Spanish URL with Q_Language parameter', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'es', 'test-uuid');
      expect(config.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?Q_Language=ES&screenerid=test-uuid',
      );
    });

    it('generates Spanish URL for Spanish locale variants (es-MX, es-ES)', () => {
      const formData = createMockFormData();
      const configMX = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'es-MX', 'test-uuid');
      const configES = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'es-ES', 'test-uuid');
      expect(configMX.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?Q_Language=ES&screenerid=test-uuid',
      );
      expect(configES.linkUrl).toBe(
        'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?Q_Language=ES&screenerid=test-uuid',
      );
    });

    it('handles missing uuid', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', undefined);
      expect(config.linkUrl).toBe('https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC?screenerid=');
    });
  });

  describe('config structure', () => {
    it('returns all required properties', () => {
      const formData = createMockFormData();
      const config = getUrbanInstitute2025BaselineSurveyConfig(formData, 'co', 'en', 'test-uuid');

      expect(typeof config.shouldShow).toBe('function');
      expect(config.message).toBeDefined();
      expect(config.linkUrl).toBeDefined();
      expect(config.linkText).toBeDefined();
      expect(config.minimizedText).toBeDefined();
      expect(config.startMinimized).toBe(true);
    });
  });
});
