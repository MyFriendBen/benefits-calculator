import { Routes, Route } from 'react-router-dom';
import FetchScreen from '../FetchScreen/FetchScreen';
import RedirectToWhiteLabel from './RedirectToWhiteLabel';
import languageRouteWrapper from './LanguageRouter';

/**
 * Loading state routes shown while config/translations are being fetched.
 * All routes render FetchScreen or redirect to white-labeled versions.
 */
const LoadingRoutes = () => {
  const redirectPaths = ['jeffcohs', 'jeffcohscm', 'ccig', 'current-benefits'];

  return (
    <Routes>
      {languageRouteWrapper(
        <>
          {redirectPaths.map((path) => (
            <Route key={path} path={path} element={<RedirectToWhiteLabel whiteLabel="co" />} />
          ))}
          <Route
            path="step-1"
            element={
              <RedirectToWhiteLabel>
                <FetchScreen />
              </RedirectToWhiteLabel>
            }
          />
          <Route path=":whiteLabel/current-benefits" element={<FetchScreen />} />
          {/* All other paths during loading show FetchScreen */}
          <Route path="*" element={<FetchScreen />} />
        </>,
      )}
    </Routes>
  );
};

export default LoadingRoutes;
