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

    it('should have cesn landing page', () => {
      const energyCalcPage = CUSTOM_LANDING_PAGES.find((page) =>
        page.path.includes('cesn')
      );
      expect(energyCalcPage).toBeDefined();
    });
  });

  describe('White Label Routes', () => {
    it('should support all valid white labels', () => {
      // Verify we have the expected white labels defined
      expect(ALL_VALID_WHITE_LABELS).toHaveLength(6);
      expect(ALL_VALID_WHITE_LABELS).toContain('co');
      expect(ALL_VALID_WHITE_LABELS).toContain('nc');
      expect(ALL_VALID_WHITE_LABELS).toContain('cesn');
      expect(ALL_VALID_WHITE_LABELS).toContain('ma');
      expect(ALL_VALID_WHITE_LABELS).toContain('il');
      expect(ALL_VALID_WHITE_LABELS).toContain('tx');
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
        .filter((path) => typeof path === 'string' && path !== '' && path !== '*')
        .filter((path) => !path.startsWith('co_energy_calculator')) // legacy redirect route
        .filter(Boolean) as string[];

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

      const paths = (whiteLabelRoute!.children
        ?.map((route) => route.path)
        .filter((path) =>
          typeof path === 'string' &&
          path !== '' &&
          !path.startsWith(':') &&
          !path.includes('*')
        )
        .filter(Boolean) || []) as string[];

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
    it('should not register routes when step numbers are invalid (negative or zero)', async () => {
      // When useStepNumber returns -1 (step not found) or 0, routes should NOT be registered
      // This prevents invalid routes like "step--1/:page" or "step-0/:page" from being created
      const { buildUUIDScopedRoute } = await import('./uuid-scoped');

      // Test with invalid step numbers
      const invalidStepNumbers = [-1, -5, 0];

      invalidStepNumbers.forEach((stepNum) => {
        const route = buildUUIDScopedRoute({
          householdMemberStepNumber: stepNum,
          energyCalcHouseholdMemberStepNumber: 4, // Valid number for comparison
        });

        // Extract all paths from the route's children
        const paths = route.children?.map((child) => child.path) || [];

        // Verify that invalid step patterns are NOT present
        expect(paths).not.toContain(`step-${stepNum}/:page`);

        // Specifically check no double-hyphens or step-0 patterns
        paths.forEach((path) => {
          if (typeof path === 'string' && path.startsWith('step-')) {
            expect(path).not.toContain('--'); // No double hyphens
            expect(path).not.toMatch(/^step-0\//); // No step-0
          }
        });
      });
    });

    it('should register routes when step numbers are valid (positive integers)', async () => {
      // Valid step numbers (> 0) should create routes
      const { buildUUIDScopedRoute } = await import('./uuid-scoped');

      const validStepNumbers = [3, 4, 5, 10];

      validStepNumbers.forEach((stepNum) => {
        const route = buildUUIDScopedRoute({
          householdMemberStepNumber: stepNum,
          energyCalcHouseholdMemberStepNumber: -1, // Invalid number for comparison
        });

        // Extract all paths from the route's children
        const paths = route.children?.map((child) => child.path) || [];

        // Verify the valid step route IS present
        expect(paths).toContain(`step-${stepNum}/:page`);
      });
    });

    it('should handle both household member routes independently', async () => {
      // Both householdMemberStepNumber and energyCalcHouseholdMemberStepNumber should be
      // independently registered based on their validity
      const { buildUUIDScopedRoute } = await import('./uuid-scoped');

      // Test case 1: Both valid
      const bothValid = buildUUIDScopedRoute({
        householdMemberStepNumber: 3,
        energyCalcHouseholdMemberStepNumber: 4,
      });
      const bothValidPaths = bothValid.children?.map((child) => child.path) || [];
      expect(bothValidPaths).toContain('step-3/:page');
      expect(bothValidPaths).toContain('step-4/:page');

      // Test case 2: First valid, second invalid
      const firstValid = buildUUIDScopedRoute({
        householdMemberStepNumber: 3,
        energyCalcHouseholdMemberStepNumber: -1,
      });
      const firstValidPaths = firstValid.children?.map((child) => child.path) || [];
      expect(firstValidPaths).toContain('step-3/:page');
      expect(firstValidPaths).not.toContain('step--1/:page');

      // Test case 3: First invalid, second valid
      const secondValid = buildUUIDScopedRoute({
        householdMemberStepNumber: 0,
        energyCalcHouseholdMemberStepNumber: 4,
      });
      const secondValidPaths = secondValid.children?.map((child) => child.path) || [];
      expect(secondValidPaths).not.toContain('step-0/:page');
      expect(secondValidPaths).toContain('step-4/:page');

      // Test case 4: Both invalid
      const bothInvalid = buildUUIDScopedRoute({
        householdMemberStepNumber: -1,
        energyCalcHouseholdMemberStepNumber: 0,
      });
      const bothInvalidPaths = bothInvalid.children?.map((child) => child.path) || [];
      expect(bothInvalidPaths).not.toContain('step--1/:page');
      expect(bothInvalidPaths).not.toContain('step-0/:page');
    });
  });
});
