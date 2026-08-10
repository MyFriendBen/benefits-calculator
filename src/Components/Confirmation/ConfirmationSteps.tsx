import { ReactNode } from 'react';
import { QuestionName } from '../../Types/Questions';
import ConfirmationZipCode from './ConfirmationZipCode';
import ConfirmationHouseholdData from './ConfirmationHouseholdData';
import ConfirmationFinancialInfo from './ConfirmationFinancialInfo';
import ConfirmationBenefitsInfo from './ConfirmationBenefitsInfo';

export const BENEFITS_GROUP_STEPS: QuestionName[] = ['hasBenefits', 'acuteHHConditions', 'referralSource'];

export const ENERGY_GROUP_STEPS: QuestionName[] = [
  'energyCalculatorExpenses',
  'energyCalculatorElectricityProvider',
  'energyCalculatorGasProvider',
  'energyCalculatorUtilityStatus',
  'energyCalculatorApplianceStatus',
];

const STEP_CONFIRMATIONS: Record<QuestionName, ReactNode | null> = {
  zipcode: <ConfirmationZipCode key="zipcode" />,
  householdSize: null,
  householdData: <ConfirmationHouseholdData key="householdData" />,
  hasExpenses: <ConfirmationFinancialInfo key="hasExpenses" />,
  householdAssets: null,
  hasBenefits: null,
  acuteHHConditions: null,
  referralSource: null,
  energyCalculatorElectricityProvider: null,
  energyCalculatorGasProvider: null,
  energyCalculatorExpenses: null,
  energyCalculatorUtilityStatus: null,
  energyCalculatorApplianceStatus: null,
  signUpInfo: null,
};

export default STEP_CONFIRMATIONS;
