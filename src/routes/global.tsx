import { Navigate, RouteObject } from 'react-router-dom';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import SelectStatePage from '../Components/Steps/SelectStatePage';

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
    { path: '*', element: <Navigate to={`step-1${urlSearchParams}`} replace /> },
  ];
};
