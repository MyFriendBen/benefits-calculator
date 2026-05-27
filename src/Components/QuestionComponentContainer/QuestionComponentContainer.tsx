import { useParams, Navigate, useLocation } from 'react-router-dom';
import { Zipcode } from '../Steps/Zipcode';
import Expenses from '../Steps/Expenses/Expenses';
import HouseholdSize from '../Steps/HouseholdSize/HouseholdSize';
import { useStepName, useStepDirectory, STARTING_QUESTION_NUMBER } from '../../Assets/stepDirectory';
import ReferralSourceStep from '../Steps/Referrer';
import { QUESTION_TITLES } from '../../Assets/pageTitleTags';
import AlreadyHasBenefits from '../Steps/AlreadyHasBenefits';
import ImmediateNeeds from '../Steps/ImmediateNeeds';
import SignUp from '../Steps/SignUp/SignUp';
import HouseholdAssets from '../Steps/HouseholdAssets/HouseholdAssets';
import ElectricityProvider from '../EnergyCalculator/Steps/ElectricityProvider';
import GasProvider from '../EnergyCalculator/Steps/GasProvider';
import EnergyCalculatorExpenses from '../EnergyCalculator/Steps/Expenses';
import Appliances from '../EnergyCalculator/Steps/Appliances';
import Utilities from '../EnergyCalculator/Steps/Utilities';
import './QuestionComponentContainer.css';
import { usePageTitle } from '../Common/usePageTitle';

// Stable step identifiers for analytics (GA4). These slugs are decoupled from
// display order so they survive step skips and reorders. See MFB-1079.
const STEP_ID_BY_QUESTION_NAME: Record<string, { stepId: string; component: JSX.Element }> = {
  zipcode: { stepId: 'zip-code', component: <Zipcode /> },
  householdSize: { stepId: 'household-size', component: <HouseholdSize /> },
  hasExpenses: { stepId: 'expenses', component: <Expenses /> },
  householdAssets: { stepId: 'assets', component: <HouseholdAssets /> },
  hasBenefits: { stepId: 'current-benefits', component: <AlreadyHasBenefits /> },
  acuteHHConditions: { stepId: 'immediate-needs', component: <ImmediateNeeds /> },
  referralSource: { stepId: 'referral-source', component: <ReferralSourceStep /> },
  signUpInfo: { stepId: 'sign-up', component: <SignUp /> },
  energyCalculatorElectricityProvider: { stepId: 'cesn-electric-provider', component: <ElectricityProvider /> },
  energyCalculatorGasProvider: { stepId: 'cesn-gas-provider', component: <GasProvider /> },
  energyCalculatorExpenses: { stepId: 'cesn-energy-expenses', component: <EnergyCalculatorExpenses /> },
  energyCalculatorApplianceStatus: { stepId: 'cesn-appliances', component: <Appliances /> },
  energyCalculatorUtilityStatus: { stepId: 'cesn-utility-status', component: <Utilities /> },
};

const QuestionComponentContainer = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  let { id } = useParams();
  const location = useLocation();
  const stepDirectory = useStepDirectory();

  // Calculate step info for all cases
  const stepNumber = id ? +id : NaN;
  const maxStep = stepDirectory.length + STARTING_QUESTION_NUMBER;
  const stepName = useStepName(stepNumber);
  const questionName = !isNaN(stepNumber) ? stepName : undefined;
  const pageTitle = questionName ? QUESTION_TITLES[questionName] : '' as any;

  // Call usePageTitle hook unconditionally
  usePageTitle(pageTitle);

  // NOW we can do conditional logic and returns
  if (id === undefined) {
    throw new Error('steps must have a step-[id]');
  }

  // Validate step number and redirect if needed
  const isInvalidStep = isNaN(stepNumber) || stepNumber < 1 || stepNumber > maxStep || questionName === undefined;

  if (isInvalidStep) {
    return <Navigate to={`../step-1${location.search}${location.hash}`} replace />;
  }

  const step = questionName ? STEP_ID_BY_QUESTION_NAME[questionName] : undefined;

  if (step === undefined) {
    return null;
  }

  return (
    <main className="benefits-form" data-step-id={step.stepId}>
      {step.component}
    </main>
  );
};

export default QuestionComponentContainer;
