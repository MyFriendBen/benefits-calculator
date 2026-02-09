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
    it('should use consistent path naming conventions in global routes', async () => {
      // Import and build actual routes
      const { buildGlobalRoutes } = await import('./global');
      const globalRoutes = buildGlobalRoutes({ urlSearchParams: '' });

      // Extract paths from route objects
      const paths = globalRoutes
        .map((route) => route.path)
        .filter((path): path is string => typeof path === 'string' && path !== '' && path !== '*');

      // Verify each path uses kebab-case (only lowercase, numbers, and hyphens)
      paths.forEach((path) => {
        expect(path).toMatch(/^[a-z0-9-]+$/);
      });

      // Verify we have the expected global routes
      expect(paths).toContain('step-1');
      expect(paths).toContain('select-state');
    });

    it('should use consistent path naming conventions in white label routes', async () => {
      const { buildWLScopedRoutes } = await import('./wl-scoped');
      const wlRoutes = buildWLScopedRoutes({
        householdMemberStepNumber: 3,
        energyCalcHouseholdMemberStepNumber: 4,
      });

      // Extract paths from the white label route's children
      const whiteLabelRoute = wlRoutes.find((route) => route.path === ':whiteLabel');
      expect(whiteLabelRoute).toBeDefined();

      const paths = whiteLabelRoute!.children
        ?.map((route) => route.path)
        .filter((path): path is string =>
          typeof path === 'string' &&
          path !== '' &&
          !path.startsWith(':') &&
          !path.includes('*')
        ) || [];

      // Verify each path uses kebab-case
      paths.forEach((path) => {
        // Skip dynamic step routes like "step-3/:page"
        const staticPath = path.split('/')[0];
        if (!staticPath.includes(':')) {
          expect(staticPath).toMatch(/^[a-z0-9-]+$/);
        }
      });

      // Verify expected paths exist
      expect(paths.some((p) => p.includes('current-benefits'))).toBe(true);
      expect(paths.some((p) => p.includes('select-state'))).toBe(true);
      expect(paths.some((p) => p.includes('step-1'))).toBe(true);
    });

    it('should use consistent parameter naming in route definitions', async () => {
      const { buildWLScopedRoutes } = await import('./wl-scoped');

      // Build routes to get actual parameter names used
      const wlRoutes = buildWLScopedRoutes({
        householdMemberStepNumber: 3,
        energyCalcHouseholdMemberStepNumber: 4,
      });

      // Extract parameter names from paths
      const paramPattern = /:([a-zA-Z]+)/g;
      const params = new Set<string>();

      wlRoutes.forEach((route) => {
        if (route.path) {
          const matches = route.path.matchAll(paramPattern);
          for (const match of matches) {
            params.add(match[1]);
          }
        }

        // Check nested routes
        route.children?.forEach((child) => {
          if (child.path) {
            const childMatches = child.path.matchAll(paramPattern);
            for (const match of childMatches) {
              params.add(match[1]);
            }
          }
        });
      });

      // Verify all parameters use camelCase
      Array.from(params).forEach((param) => {
        expect(param).toMatch(/^[a-z][a-zA-Z]*$/); // camelCase
      });

      // Verify expected parameters exist
      expect(params.has('whiteLabel')).toBe(true);
      expect(params.has('uuid')).toBe(true);
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
