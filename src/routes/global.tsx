import { Navigate, RouteObject, useLocation } from 'react-router-dom';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import SelectStatePage from '../Components/Steps/SelectStatePage';

/**
 * Legacy white label redirect component.
 * Redirects /co_energy_calculator/* to /cesn/* while preserving the path, query, and hash.
 */
const LegacyWhiteLabelRedirect = () => {
  const location = useLocation();
  const newPath = location.pathname.replace('/co_energy_calculator', '/cesn');
  return <Navigate to={`${newPath}${location.search}${location.hash}`} replace />;
};

interface GlobalRoutesOptions {
  urlSearchParams: string;
}

/**
 * Global routes accessible without organization context.
 * These routes work without a white label parameter in the URL.
 */
export const buildGlobalRoutes = ({ urlSearchParams }: GlobalRoutesOptions): RouteObject[] => {
  return [
    { path: '', element: <Navigate to={`step-1${urlSearchParams}`} replace /> },
    { path: 'step-1', element: <SelectLanguagePage /> },
    { path: 'select-state', element: <SelectStatePage /> },
    // Legacy white label redirect: /co_energy_calculator → /cesn
    // Note: Also configured in Cloudflare Page Rules for edge-level redirect (primary)
    // This is a fallback for cases where Cloudflare redirect doesn't run
    { path: 'co_energy_calculator/*', element: <LegacyWhiteLabelRedirect /> },
    { path: '*', element: <Navigate to={`step-1${urlSearchParams}`} replace /> },
  ];
};
