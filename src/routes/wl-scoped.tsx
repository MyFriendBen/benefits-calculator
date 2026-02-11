import { RouteObject } from 'react-router-dom';
import ValidateWhiteLabel from '../Components/RouterUtil/ValidateWhiteLabel';
import WhiteLabelRouter from '../Components/RouterUtil/WhiteLabelRouter';
import CurrentBenefits from '../Components/CurrentBenefits/CurrentBenefits';
import SelectStatePage from '../Components/Steps/SelectStatePage';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import Disclaimer from '../Components/Steps/Disclaimer/Disclaimer';
import { buildUUIDScopedRoute } from './uuid-scoped';
import { CUSTOM_LANDING_PAGES } from './custom-landing-pages';
import SessionInitializer from '../Components/RouterUtil/SessionInitializer';

interface WLScopedRoutesOptions {
  householdMemberStepNumber: number;
  energyCalcHouseholdMemberStepNumber: number;
}

/**
 * Routes scoped to white label (requires :whiteLabel parameter).
 * Includes both custom partner landing pages and generic white label routes.
 */
export const buildWLScopedRoutes = ({
  householdMemberStepNumber,
  energyCalcHouseholdMemberStepNumber,
}: WLScopedRoutesOptions): RouteObject[] => {
  // Custom landing pages - checked first before generic :whiteLabel pattern
  const customLandingPages: RouteObject[] = CUSTOM_LANDING_PAGES.map(
    ({ path, whiteLabel, component: Component, props }) => ({
      path,
      element: <SessionInitializer whiteLabel={whiteLabel} />,
      children: [
        {
          index: true,
          element: <Component {...(props || {})} />,
        },
      ],
    }),
  );

  // Build UUID-scoped routes
  const uuidRoute = buildUUIDScopedRoute({
    householdMemberStepNumber,
    energyCalcHouseholdMemberStepNumber,
  });

  // Generic :whiteLabel routes (matched after custom landing pages)
  const whiteLabelRoute: RouteObject = {
    path: ':whiteLabel',
    element: <ValidateWhiteLabel />,
    children: [
      { index: true, element: <WhiteLabelRouter /> },
      { path: 'current-benefits', element: <CurrentBenefits /> },
      { path: 'select-state', element: <SelectStatePage /> },
      { path: 'step-1', element: <SelectLanguagePage /> },
      { path: 'step-2', element: <Disclaimer /> },
      uuidRoute,
    ],
  };

  // CRITICAL: Route order matters!
  // React Router matches routes in the order they appear. Custom landing pages
  // (e.g., 'co/jeffcohs') MUST come before the generic ':whiteLabel' route,
  // otherwise all paths would match ':whiteLabel' first and custom pages would never render.
  //
  // Correct: ['co/jeffcohs', 'co/ccig', ':whiteLabel'] ✅
  // Wrong:   [':whiteLabel', 'co/jeffcohs', 'co/ccig'] ❌ (custom pages unreachable)
  return [...customLandingPages, whiteLabelRoute];
};
