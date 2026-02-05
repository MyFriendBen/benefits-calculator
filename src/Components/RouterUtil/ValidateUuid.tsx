import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useQueryString } from '../QuestionComponents/questionHooks';

export function isValidUuid(uuid: string) {
  // https://stackoverflow.com/questions/20041051/how-to-judge-a-string-is-uuid-type
  const uuidRegx = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  return uuidRegx.test(uuid);
}

// Layout route that validates the uuid param before rendering child routes
export default function ValidateUuid() {
  const { uuid } = useParams();
  const queryParams = useQueryString();
  const link = `/step-1${queryParams}`;

  if (uuid === undefined || !isValidUuid(uuid)) {
    return <Navigate to={link} replace />;
  }

  return <Outlet />;
}
