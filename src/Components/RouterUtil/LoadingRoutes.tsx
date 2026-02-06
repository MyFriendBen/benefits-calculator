import { Routes, Route } from 'react-router-dom';
import FetchScreen from '../FetchScreen/FetchScreen';
import RedirectToWhiteLabel from './RedirectToWhiteLabel';
import languageRouteWrapper from './LanguageRouter';

/**
 * Paths that should redirect to white-labeled versions during loading.
 * These are legacy/shorthand URLs that map to the Colorado white label.
 */
const CO_REDIRECT_PATHS = ['jeffcohs', 'jeffcohscm', 'ccig', 'current-benefits'];

/**
 * Loading state routes shown while config/translations are being fetched.
 *
 * This component handles two phases during initialization:
 * 1. REDIRECT: Legacy/shorthand URLs → Full white label URLs (e.g., /jeffcohs → /co/jeffcohs)
 * 2. LOADING: Show FetchScreen while config loads
 *
 * Once config/translations finish loading, AppLayout switches to AppRoutes (the main app routes).
 */
const LoadingRoutes = () => {
  return (
    <Routes>
      {languageRouteWrapper(
        <>
          {/* Legacy CO shorthand paths redirect to full white label URL */}
          {CO_REDIRECT_PATHS.map((path) => (
            <Route key={path} path={path} element={<RedirectToWhiteLabel whiteLabel="co" />} />
          ))}

          {/* step-1 shows loading screen after redirect to white label */}
          <Route
            path="step-1"
            element={
              <RedirectToWhiteLabel>
                <FetchScreen />
              </RedirectToWhiteLabel>
            }
          />

          {/* White-labeled current-benefits shows loading screen */}
          <Route path=":whiteLabel/current-benefits" element={<FetchScreen />} />

          {/* UUID routes for data restoration */}
          <Route path=":whiteLabel/:uuid">
            <Route path="" element={<FetchScreen />} />
            <Route path="*" element={<FetchScreen />} />
          </Route>
          <Route path=":uuid">
            <Route path="" element={<FetchScreen />} />
            <Route path="*" element={<FetchScreen />} />
          </Route>

          {/* Catch-all: show loading screen for all other paths */}
          <Route path="*" element={<FetchScreen />} />
        </>,
      )}
    </Routes>
  );
};

export default LoadingRoutes;
