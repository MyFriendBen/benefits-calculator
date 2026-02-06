import { Route } from 'react-router-dom';
import ValidateWhiteLabel from '../Components/RouterUtil/ValidateWhiteLabel';
import WhiteLabelRouter from '../Components/RouterUtil/WhiteLabelRouter';
import CurrentBenefits from '../Components/CurrentBenefits/CurrentBenefits';
import SelectStatePage from '../Components/Steps/SelectStatePage';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import Disclaimer from '../Components/Steps/Disclaimer/Disclaimer';
import UUIDScopedRoutes from './uuid-scoped';
import { CUSTOM_LANDING_PAGES } from './custom-landing-pages';

/**
 * Routes scoped to white label (requires :whiteLabel parameter).
 * Includes both custom partner landing pages and generic white label routes.
 */
const WLScopedRoutes = () => {
  return (
    <>
      {/* Custom landing pages - checked first before generic :whiteLabel pattern */}
      {CUSTOM_LANDING_PAGES.map(({ path, component: Component, props }) => (
        <Route key={path} path={path} element={<Component {...(props || {})} />} />
      ))}

      {/* Generic :whiteLabel routes (matched after custom landing pages) */}
      <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
        <Route index element={<WhiteLabelRouter />} />
        <Route path="current-benefits" element={<CurrentBenefits />} />
        <Route path="select-state" element={<SelectStatePage />} />
        <Route path="step-1" element={<SelectLanguagePage />} />
        <Route path="step-2" element={<Disclaimer />} />

        {UUIDScopedRoutes()}
      </Route>
    </>
  );
};

export default WLScopedRoutes;
