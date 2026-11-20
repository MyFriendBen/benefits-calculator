import { Navigate, RouteObject } from 'react-router-dom';
import ValidateUuid from '../Components/RouterUtil/ValidateUuid';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import Disclaimer from '../Components/Steps/Disclaimer/Disclaimer';
import HouseholdMemberRouter from '../Components/Steps/HouseholdMembers/components/HouseholdMemberRouter';
import QuestionComponentContainer from '../Components/QuestionComponentContainer/QuestionComponentContainer';
import Confirmation from '../Components/Confirmation/Confirmation';
import { useStepId } from '../Components/RouterUtil/useStepId';
import resultsRoutes from './results';

// Matches any single segment so the questionnaire's `step-<id>` URLs reach the container.
// A segment that isn't a `step-<id>` falls back to step 1, like the catch-all below.
const StepRoute = () => {
  const stepId = useStepId();
  if (stepId === undefined) {
    return <Navigate to="../step-1" replace />;
  }
  return <QuestionComponentContainer key={window.location.href} />;
};

interface UUIDScopedRoutesOptions {
  householdMemberStepNumber: number;
}

/**
 * Routes scoped to UUID (requires :uuid parameter).
 * These routes represent the main application flow after a session is created.
 *
 * Returns a single RouteObject with nested children routes.
 */
export const buildUUIDScopedRoute = ({ householdMemberStepNumber }: UUIDScopedRoutesOptions): RouteObject => {
  const children: RouteObject[] = [
    { index: true, element: <Navigate to="step-1" replace /> },
    { path: 'step-1', element: <SelectLanguagePage /> },
    { path: 'step-2', element: <Disclaimer /> },
  ];

  // Dynamic household member form routes
  // Only register routes if step exists (> 0). useStepNumber returns -1 when step doesn't exist.
  if (householdMemberStepNumber > 0) {
    children.push({
      path: `step-${householdMemberStepNumber}/:page`,
      element: <HouseholdMemberRouter />,
    });
  }

  // Generic questionnaire step (catch-all for remaining steps)
  // QuestionComponentContainer validates step number internally
  // TODO(MFB-642): Evaluate if key remounting is needed here or if component handles param changes
  children.push(
    { path: ':stepSegment', element: <StepRoute /> },
    { path: 'confirm-information', element: <Confirmation /> },
    ...resultsRoutes,
    { path: '*', element: <Navigate to="step-1" replace /> },
  );

  return {
    path: ':uuid',
    element: <ValidateUuid />,
    children,
  };
};
