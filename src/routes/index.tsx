import { useRoutes, useLocation, RouteObject } from 'react-router-dom';
import { useStepNumber } from '../Assets/stepDirectory';
import languageOptions from '../Assets/languageOptions';
import { buildGlobalRoutes } from './global';
import { buildWLScopedRoutes } from './wl-scoped';

/**
 * Main routing component for the application.
 * Organized by scope: Global → WLScoped → UUIDScoped
 *
 * Uses useRoutes hook with route configuration objects.
 * Route building logic is delegated to separate files for better organization.
 */
const AppRoutes = () => {
  const location = useLocation();
  const urlSearchParams = location.search;
  const languages = Object.keys(languageOptions);

  // Get dynamic step numbers (hooks must be called in component)
  const householdMemberStepNumber = useStepNumber('householdData', false);
  const energyCalcHouseholdMemberStepNumber = useStepNumber('energyCalculatorHouseholdData', false);

  // Build route configurations using helper functions
  const globalRoutes = buildGlobalRoutes({ urlSearchParams });
  const whiteLabelRoutes = buildWLScopedRoutes({
    householdMemberStepNumber,
    energyCalcHouseholdMemberStepNumber,
  });

  // Combine all routes with language prefixes
  const baseRoutes = [...globalRoutes, ...whiteLabelRoutes];

  const languagePrefixedRoutes: RouteObject[] = languages.map((language) => ({
    path: language,
    children: baseRoutes,
  }));

  const allRoutes = [...languagePrefixedRoutes, ...baseRoutes];

  return useRoutes(allRoutes);
};

export default AppRoutes;
