import { Navigate, RouteObject } from 'react-router-dom';
import ValidateUuid from '../Components/RouterUtil/ValidateUuid';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import Disclaimer from '../Components/Steps/Disclaimer/Disclaimer';
import HouseholdMemberForm from '../Components/Steps/HouseholdMembers/HouseholdMemberForm';
import EcHouseholdMemberForm from '../Components/EnergyCalculator/Steps/HouseholdMemberForm';
import QuestionComponentContainer from '../Components/QuestionComponentContainer/QuestionComponentContainer';
import Confirmation from '../Components/Confirmation/Confirmation';
import resultsRoutes from './results';

interface UUIDScopedRoutesOptions {
  householdMemberStepNumber: number;
  energyCalcHouseholdMemberStepNumber: number;
}

/**
 * Routes scoped to UUID (requires :uuid parameter).
 * These routes represent the main application flow after a session is created.
 *
 * Returns a single RouteObject with nested children routes.
 */
export const buildUUIDScopedRoute = ({
  householdMemberStepNumber,
  energyCalcHouseholdMemberStepNumber,
}: UUIDScopedRoutesOptions): RouteObject => {
  const children: RouteObject[] = [
    { index: true, element: <Navigate to="step-1" replace /> },
    { path: 'step-1', element: <SelectLanguagePage /> },
    { path: 'step-2', element: <Disclaimer /> },
  ];

  // Dynamic household member form routes
  // Only register routes if step exists (> 0). useStepNumber returns -1 when step doesn't exist.
  // TODO(MFB-642): Remove key={window.location.href} anti-pattern. Currently forces full
  // remount on navigation. Should be replaced with useEffect + form.reset() pattern when
  // page param changes. See Linear ticket for implementation details and testing requirements.
  if (householdMemberStepNumber > 0) {
    children.push({
      path: `step-${householdMemberStepNumber}/:page`,
      element: <HouseholdMemberForm key={window.location.href} />,
    });
  }

  if (energyCalcHouseholdMemberStepNumber > 0) {
    children.push({
      path: `step-${energyCalcHouseholdMemberStepNumber}/:page`,
      element: <EcHouseholdMemberForm key={window.location.href} />,
    });
  }

  // Generic questionnaire step (catch-all for remaining steps)
  // TODO(MFB-642): Evaluate if key remounting is needed here or if component handles param changes
  children.push(
    { path: 'step-:id', element: <QuestionComponentContainer key={window.location.href} /> },
    { path: 'confirm-information', element: <Confirmation /> },
    ...resultsRoutes,
    { path: '*', element: <Navigate to="step-1" replace /> }
  );

  return {
    path: ':uuid',
    element: <ValidateUuid />,
    children,
  };
};
