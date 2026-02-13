import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { ALL_VALID_WHITE_LABELS, WhiteLabel } from '../../Types/WhiteLabel';
import { useQueryString } from '../QuestionComponents/questionHooks';

const LEGACY_WHITE_LABEL_REDIRECTS: Record<string, string> = {
  co_energy_calculator: 'cesn',
};

// Layout route that validates the whiteLabel param before rendering child routes
export default function ValidateWhiteLabel() {
  const { whiteLabel } = useParams();
  const queryParams = useQueryString();
  const location = useLocation();

  // Redirect legacy white label paths (e.g., /co_energy_calculator/* → /cesn/*)
  // Uses window.location.replace() instead of <Navigate> to force a full page reload,
  // ensuring the app initializes fresh with the correct white label config.
  if (whiteLabel && whiteLabel in LEGACY_WHITE_LABEL_REDIRECTS) {
    const newWhiteLabel = LEGACY_WHITE_LABEL_REDIRECTS[whiteLabel];
    const newPath = location.pathname.replace(new RegExp(`^/${whiteLabel}`), `/${newWhiteLabel}`);
    window.location.replace(`${newPath}${location.search}${location.hash}`);
    return null;
  }

  if (whiteLabel === undefined || !ALL_VALID_WHITE_LABELS.includes(whiteLabel as WhiteLabel)) {
    return <Navigate to={`/step-1${queryParams}`} replace />;
  }

  return <Outlet />;
}
