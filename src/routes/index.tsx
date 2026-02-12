import { useRoutes, useLocation } from 'react-router-dom';
import { useStepNumber } from '../Assets/stepDirectory';
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

  // Get dynamic step numbers (hooks must be called in component)
  const householdMemberStepNumber = useStepNumber('householdData', false);
  const energyCalcHouseholdMemberStepNumber = useStepNumber('energyCalculatorHouseholdData', false);

  // Build route configurations using helper functions
  const globalRoutes = buildGlobalRoutes({ urlSearchParams });
  const whiteLabelRoutes = buildWLScopedRoutes({
    householdMemberStepNumber,
    energyCalcHouseholdMemberStepNumber,
  });

  const allRoutes = [...whiteLabelRoutes, ...globalRoutes];

  return useRoutes(allRoutes);
};

export default AppRoutes;
