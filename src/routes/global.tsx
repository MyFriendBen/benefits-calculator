import { Route, Navigate } from 'react-router-dom';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import SelectStatePage from '../Components/Steps/SelectStatePage';

interface GlobalRoutesProps {
  urlSearchParams: string;
}

/**
 * Global routes accessible without organization context.
 * These routes work without a white label parameter in the URL.
 */
const GlobalRoutes = ({ urlSearchParams }: GlobalRoutesProps) => {
  return (
    <>
      <Route path="" element={<Navigate to={`/step-1${urlSearchParams}`} replace />} />
      <Route path="step-1" element={<SelectLanguagePage />} />
      <Route path="select-state" element={<SelectStatePage />} />
      <Route path="*" element={<Navigate to={`/step-1${urlSearchParams}`} replace />} />
    </>
  );
};

export default GlobalRoutes;
