import { Navigate, Outlet, useParams } from 'react-router-dom';
import { ALL_VALID_WHITE_LABELS, WhiteLabel } from '../../Types/WhiteLabel';
import { useQueryString } from '../QuestionComponents/questionHooks';

// Layout route that validates the whiteLabel param before rendering child routes
export default function ValidateWhiteLabel() {
  const { whiteLabel } = useParams();
  const queryParams = useQueryString();
  const link = `/step-1${queryParams}`;

  if (whiteLabel === undefined || !ALL_VALID_WHITE_LABELS.includes(whiteLabel as WhiteLabel)) {
    return <Navigate to={link} replace />;
  }

  return <Outlet />;
}
