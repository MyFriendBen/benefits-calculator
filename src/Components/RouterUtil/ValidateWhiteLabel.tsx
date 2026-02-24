import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { ALL_VALID_WHITE_LABELS, LEGACY_WHITE_LABEL_REDIRECTS, WhiteLabel } from '../../Types/WhiteLabel';
import { useQueryString } from '../QuestionComponents/questionHooks';

// Layout route that validates the whiteLabel param before rendering child routes
export default function ValidateWhiteLabel() {
  const { whiteLabel } = useParams();
  const queryParams = useQueryString();
  const location = useLocation();

  // Redirect legacy white label paths (e.g., /co_energy_calculator/* → /cesn/*)
  // Uses <Navigate replace> instead of window.location.replace() to avoid a full page reload,
  // which would cause GA4 to fire a page_view on the old URL before the redirect.
  // NOTE: This approach only works correctly when the legacy WL and its target share the same
  // white label config — since <Navigate> does a client-side route swap, the app config is NOT
  // reloaded. If a redirect ever targets a WL with different config, use window.location.replace()
  // instead to force a full reload.
  if (whiteLabel && whiteLabel in LEGACY_WHITE_LABEL_REDIRECTS) {
    const newWhiteLabel = LEGACY_WHITE_LABEL_REDIRECTS[whiteLabel];
    const newPath = location.pathname.replace(new RegExp(`^/${whiteLabel}`), `/${newWhiteLabel}`);
    return <Navigate to={`${newPath}${location.search}${location.hash}`} replace />;
  }

  if (whiteLabel === undefined || !ALL_VALID_WHITE_LABELS.includes(whiteLabel as WhiteLabel)) {
    return <Navigate to={`/step-1${queryParams}`} replace />;
  }

  return <Outlet />;
}
