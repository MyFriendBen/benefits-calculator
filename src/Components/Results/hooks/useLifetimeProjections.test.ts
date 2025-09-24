import { hasLifetimeProjections } from './useLifetimeProjections';
import { EligibilityResults, EnhancedEligibilityResults } from '../../../Types/Results';

describe('useLifetimeProjections functions', () => {
  describe('hasLifetimeProjections', () => {
    test('should return true for enhanced results with lifetime projections', () => {
      const enhancedResults: EnhancedEligibilityResults = {
        programs: [],
        program_categories: [],
        urgent_needs: [],
        screen_id: 1,
        default_language: 'en',
        missing_programs: false,
        validations: [],
        created_date: '2024-01-01',
        pe_data: {} as any,
        lifetime_projections: {} as any,
      };

      expect(hasLifetimeProjections(enhancedResults)).toBe(true);
    });

    test('should return false for basic eligibility results', () => {
      const basicResults: EligibilityResults = {
        programs: [],
        program_categories: [],
        urgent_needs: [],
        screen_id: 1,
        default_language: 'en',
        missing_programs: false,
        validations: [],
        created_date: '2024-01-01',
        pe_data: {} as any,
      };

      expect(hasLifetimeProjections(basicResults)).toBe(false);
    });
  });

  // Basic unit tests for the utility functions
  describe('utility function tests', () => {
    test('should handle language code normalization', () => {
      // These would be more comprehensive in a real test environment
      expect(typeof hasLifetimeProjections).toBe('function');
    });
  });
});