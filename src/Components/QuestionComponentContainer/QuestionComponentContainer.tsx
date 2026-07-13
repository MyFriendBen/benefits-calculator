import { useEffect } from 'react';
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
import { useTrackEvent } from '../../Assets/analytics';
import { STEP_ANALYTICS_ID_BY_QUESTION_NAME } from '../../Assets/analytics/stepIds';

// Maps each question to its step component. The stable analytics stepId string
// for each question lives in `Assets/analytics/stepIds.ts` (shared with call
// sites outside this container) — keep the two maps' keys in sync.
const STEP_ID_BY_QUESTION_NAME: Record<string, { stepId: string; Component: React.ComponentType }> = {
  zipcode: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.zipcode!, Component: Zipcode },
  householdSize: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.householdSize!, Component: HouseholdSize },
  hasExpenses: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.hasExpenses!, Component: Expenses },
  householdAssets: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.householdAssets!, Component: HouseholdAssets },
  hasBenefits: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.hasBenefits!, Component: AlreadyHasBenefits },
  acuteHHConditions: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.acuteHHConditions!, Component: ImmediateNeeds },
  referralSource: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.referralSource!, Component: ReferralSourceStep },
  signUpInfo: { stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.signUpInfo!, Component: SignUp },
  energyCalculatorElectricityProvider: {
    stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.energyCalculatorElectricityProvider!,
    Component: ElectricityProvider,
  },
  energyCalculatorGasProvider: {
    stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.energyCalculatorGasProvider!,
    Component: GasProvider,
  },
  energyCalculatorExpenses: {
    stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.energyCalculatorExpenses!,
    Component: EnergyCalculatorExpenses,
  },
  energyCalculatorApplianceStatus: {
    stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.energyCalculatorApplianceStatus!,
    Component: Appliances,
  },
  energyCalculatorUtilityStatus: {
    stepId: STEP_ANALYTICS_ID_BY_QUESTION_NAME.energyCalculatorUtilityStatus!,
    Component: Utilities,
  },
};

const QuestionComponentContainer = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  let { id } = useParams();
  const location = useLocation();
  const stepDirectory = useStepDirectory();
  const track = useTrackEvent();

  // Calculate step info for all cases
  const stepNumber = id ? +id : NaN;
  const maxStep = stepDirectory.length + STARTING_QUESTION_NUMBER;
  const stepName = useStepName(stepNumber);
  const questionName = !isNaN(stepNumber) ? stepName : undefined;
  const pageTitle = questionName ? QUESTION_TITLES[questionName] : '' as any;

  // Call usePageTitle hook unconditionally
  usePageTitle(pageTitle);

  const step = questionName ? STEP_ID_BY_QUESTION_NAME[questionName] : undefined;

  // This route remounts on every navigation (see `key={window.location.href}` at the
  // route definition), so this effect firing on mount is equivalent to firing on each
  // step view — it will not double-fire for the same step.
  useEffect(() => {
    if (step !== undefined) {
      track('screener_form_step', {
        screener_step_name: step.stepId,
        screener_step_number: stepNumber,
        step_action: 'view',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stepNumber]);

  // NOW we can do conditional logic and returns
  if (id === undefined) {
    throw new Error('steps must have a step-[id]');
  }

  // Validate step number and redirect if needed
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > maxStep || questionName === undefined) {
    return <Navigate to={`../step-1${location.search}${location.hash}`} replace />;
  }

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
