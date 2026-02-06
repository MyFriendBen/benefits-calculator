import { Routes, useLocation } from 'react-router-dom';
import GlobalRoutes from './global';
import WLScopedRoutes from './wl-scoped';
import languageRouteWrapper from '../Components/RouterUtil/LanguageRouter';

/**
 * Main routing component for the application.
 * Organized by scope: Global → WLScoped → UUIDScoped
 */
const AppRoutes = () => {
  const location = useLocation();
  const urlSearchParams = location.search;

  return (
    <Routes>
      {languageRouteWrapper(
        <>
          {GlobalRoutes({ urlSearchParams })}
          {WLScopedRoutes()}
        </>,
      )}
    </Routes>
  );
};

export default AppRoutes;
