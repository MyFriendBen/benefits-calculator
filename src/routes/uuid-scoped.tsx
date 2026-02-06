import { Route, Navigate } from 'react-router-dom';
import ValidateUuid from '../Components/RouterUtil/ValidateUuid';
import SelectLanguagePage from '../Components/Steps/SelectLanguage';
import Disclaimer from '../Components/Steps/Disclaimer/Disclaimer';
import HouseholdMemberForm from '../Components/Steps/HouseholdMembers/HouseholdMemberForm';
import EcHouseholdMemberForm from '../Components/EnergyCalculator/Steps/HouseholdMemberForm';
import QuestionComponentContainer from '../Components/QuestionComponentContainer/QuestionComponentContainer';
import Confirmation from '../Components/Confirmation/Confirmation';
import ResultsRoutes from './results';
import { useStepNumber } from '../Assets/stepDirectory';

/**
 * Routes scoped to UUID (requires :uuid parameter).
 * These routes represent the main application flow after a session is created.
 */
const UUIDScopedRoutes = () => {
  const householdMemberStepNumber = useStepNumber('householdData', false);
  const energyCalcHouseholdMemberStepNumber = useStepNumber('energyCalculatorHouseholdData', false);

  return (
    <Route path=":uuid" element={<ValidateUuid />}>
      <Route index element={<Navigate to="step-1" replace />} />
      <Route path="step-1" element={<SelectLanguagePage />} />
      <Route path="step-2" element={<Disclaimer />} />

      {/* Dynamic household member form routes */}
      {/* TODO(MFB-642): Remove key={window.location.href} anti-pattern. Currently forces full
          remount on navigation. Should be replaced with useEffect + form.reset() pattern when
          page param changes. See Linear ticket for implementation details and testing requirements. */}
      <Route
        path={`step-${householdMemberStepNumber}/:page`}
        element={<HouseholdMemberForm key={window.location.href} />}
      />
      <Route
        path={`step-${energyCalcHouseholdMemberStepNumber}/:page`}
        element={<EcHouseholdMemberForm key={window.location.href} />}
      />

      {/* Generic questionnaire step (catch-all for remaining steps) */}
      {/* TODO(MFB-642): Evaluate if key remounting is needed here or if component handles param changes */}
      <Route path="step-:id" element={<QuestionComponentContainer key={window.location.href} />} />

      <Route path="confirm-information" element={<Confirmation />} />

      {ResultsRoutes()}

      {/* Catch-all: redirect any unmatched paths to step-1 */}
      <Route path="*" element={<Navigate to="step-1" replace />} />
    </Route>
  );
};

export default UUIDScopedRoutes;
