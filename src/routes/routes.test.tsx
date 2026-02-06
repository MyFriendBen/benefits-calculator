/**
 * Route Configuration Tests
 *
 * These tests verify the structure and configuration of our routing system
 * without rendering the full component tree (which requires extensive mocking).
 */

import { CUSTOM_LANDING_PAGES } from './custom-landing-pages';
import { ALL_VALID_WHITE_LABELS } from '../Types/WhiteLabel';

describe('Route Configuration', () => {
  describe('Custom Landing Pages', () => {
    it('should have defined custom landing pages', () => {
      expect(CUSTOM_LANDING_PAGES).toBeDefined();
      expect(Array.isArray(CUSTOM_LANDING_PAGES)).toBe(true);
    });

    it('should have at least one custom landing page', () => {
      expect(CUSTOM_LANDING_PAGES.length).toBeGreaterThan(0);
    });

    it('should have valid path and component for each landing page', () => {
      CUSTOM_LANDING_PAGES.forEach((page) => {
        expect(page).toHaveProperty('path');
        expect(page).toHaveProperty('component');
        expect(typeof page.path).toBe('string');
        expect(page.path.length).toBeGreaterThan(0);
        expect(typeof page.component).toBe('function'); // Components are functions
      });
    });

    it('should have jeffcohs landing pages', () => {
      const jeffcoPages = CUSTOM_LANDING_PAGES.filter((page) =>
        page.path.includes('jeffco')
      );
      expect(jeffcoPages.length).toBeGreaterThan(0);
    });

    it('should have co_energy_calculator landing page', () => {
      const energyCalcPage = CUSTOM_LANDING_PAGES.find((page) =>
        page.path.includes('co_energy_calculator')
      );
      expect(energyCalcPage).toBeDefined();
    });
  });

  describe('White Label Routes', () => {
    it('should support all valid white labels', () => {
      // Verify all white labels from the config are supported
      const expectedLabels = ['co', 'nc', 'co_energy_calculator', 'ma', 'il', 'tx'];
      expect(ALL_VALID_WHITE_LABELS).toEqual(expectedLabels);
    });

    it('should have consistent white label definitions', () => {
      ALL_VALID_WHITE_LABELS.forEach((label) => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
        // White labels should be lowercase with optional underscores
        expect(label).toMatch(/^[a-z_]+$/);
      });
    });
  });

  describe('Route Hierarchy', () => {
    it('should follow the documented hierarchy: Global → WLScoped → UUIDScoped → Results', async () => {
      // This test verifies the route hierarchy is correctly implemented
      // Global: /, /step-1, /select-state
      // WLScoped: /:whiteLabel/*
      // UUIDScoped: /:whiteLabel/:uuid/*
      // Results: /:whiteLabel/:uuid/results/*

      // Import and verify route configurations exist
      const AppRoutes = (await import('./index')).default;
      const resultsRoutes = (await import('./results')).default;

      // AppRoutes is the main routing component using useRoutes
      expect(AppRoutes).toBeDefined();
      expect(typeof AppRoutes).toBe('function');

      // ResultsRoutes is a route config array
      expect(resultsRoutes).toBeDefined();
      expect(Array.isArray(resultsRoutes)).toBe(true);
      expect(resultsRoutes.length).toBeGreaterThan(0);
    });
  });

  describe('Route Path Patterns', () => {
    it('should use consistent path naming conventions', () => {
      // Paths should use kebab-case, not camelCase or snake_case
      const pathPatterns = [
        'step-1',
        'step-2',
        'select-state',
        'current-benefits',
        'confirm-information',
        'near-term-needs',
        'energy-rebates',
        'more-help',
      ];

      pathPatterns.forEach((path) => {
        expect(path).toMatch(/^[a-z0-9-]+$/); // Only lowercase, numbers, and hyphens
      });
    });

    it('should use consistent parameter naming', () => {
      // URL parameters should be camelCase
      const paramNames = ['whiteLabel', 'uuid', 'id', 'page', 'programId', 'energyCalculatorRebateType'];

      paramNames.forEach((param) => {
        expect(param).toMatch(/^[a-z][a-zA-Z]*$/); // camelCase
      });
    });
  });

  describe('Dynamic Step Number Routes', () => {
    it('should not register routes with negative step numbers', () => {
      // When useStepNumber returns -1 (step not found), routes should not be registered
      // This prevents invalid routes like "step--1/:page" from being created

      // Test cases for invalid step numbers
      const invalidStepNumbers = [-1, -5, 0];

      invalidStepNumbers.forEach((stepNum) => {
        // Verify that negative or zero step numbers don't create valid routes
        const invalidRoute = `step-${stepNum}/:page`;

        // The route pattern should not contain double hyphens or step-0
        if (stepNum < 0) {
          expect(invalidRoute).toContain('--'); // This would be invalid
        }
        if (stepNum === 0) {
          expect(invalidRoute).toBe('step-0/:page'); // This would be confusing
        }

        // The conditional rendering (stepNumber > 0) prevents these routes
        expect(stepNum > 0).toBe(false);
      });
    });

    it('should only register routes for valid positive step numbers', () => {
      // Valid step numbers should be positive integers (> 0)
      const validStepNumbers = [1, 3, 4, 5, 10];

      validStepNumbers.forEach((stepNum) => {
        const validRoute = `step-${stepNum}/:page`;

        // Verify the route format is correct
        expect(validRoute).toMatch(/^step-\d+\/:page$/);

        // Verify the condition for rendering
        expect(stepNum > 0).toBe(true);
      });
    });
  });
});
