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
const STEP_ID_BY_QUESTION_NAME: Record<string, { stepId: string; Component: React.ComponentType }> = {
  zipcode: { stepId: 'zip-code', Component: Zipcode },
  householdSize: { stepId: 'household-size', Component: HouseholdSize },
  hasExpenses: { stepId: 'expenses', Component: Expenses },
  householdAssets: { stepId: 'assets', Component: HouseholdAssets },
  hasBenefits: { stepId: 'current-benefits', Component: AlreadyHasBenefits },
  acuteHHConditions: { stepId: 'additional-resources', Component: ImmediateNeeds },
  referralSource: { stepId: 'referral-source', Component: ReferralSourceStep },
  signUpInfo: { stepId: 'sign-up', Component: SignUp },
  energyCalculatorElectricityProvider: { stepId: 'cesn-electric-provider', Component: ElectricityProvider },
  energyCalculatorGasProvider: { stepId: 'cesn-gas-provider', Component: GasProvider },
  energyCalculatorExpenses: { stepId: 'cesn-energy-expenses', Component: EnergyCalculatorExpenses },
  energyCalculatorApplianceStatus: { stepId: 'cesn-appliances', Component: Appliances },
  energyCalculatorUtilityStatus: { stepId: 'cesn-utility-status', Component: Utilities },
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
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > maxStep || questionName === undefined) {
    return <Navigate to={`../step-1${location.search}${location.hash}`} replace />;
  }

  const step = STEP_ID_BY_QUESTION_NAME[questionName];

  if (step === undefined) {
    return null;
  }

  const { Component } = step;

  return (
    <main className="benefits-form" data-step-id={step.stepId}>
      <Component />
    </main>
  );
};

export default QuestionComponentContainer;
