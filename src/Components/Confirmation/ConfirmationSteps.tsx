import { ReactNode } from 'react';
import { QuestionName } from '../../Types/Questions';
import ConfirmationZipCode from './ConfirmationZipCode';
import ConfirmationHouseholdData from './ConfirmationHouseholdData';
import ConfirmationFinancialInfo from './ConfirmationFinancialInfo';
import ConfirmationBenefitsInfo from './ConfirmationBenefitsInfo';
import ConfirmationAcuteConditions from './ConfirmationAcuteConditions';
import ConfirmationReferralSource from './ConfirmationReferralSource';
import EnergyCalculatorElectricityProvider from '../EnergyCalculator/ConfirmationPage/ElectricityProvider';
import EnergyCalculatorGasProvider from '../EnergyCalculator/ConfirmationPage/GasProvider';
import EnergyCalculatorExpenses from '../EnergyCalculator/ConfirmationPage/Expenses';
import EnergyCalculatorUtilityStatus from '../EnergyCalculator/ConfirmationPage/UtilityStatus';
import EnergyCalculatorApplianceStatus from '../EnergyCalculator/ConfirmationPage/ApplianceStatus';

const STEP_CONFIRMATIONS: Record<QuestionName, ReactNode | null> = {
  zipcode: <ConfirmationZipCode key="zipcode" />,
  householdSize: null,
  householdData: <ConfirmationHouseholdData key="householdData" />,
  hasExpenses: <ConfirmationFinancialInfo key="hasExpenses" />,
  householdAssets: null,
  hasBenefits: <ConfirmationBenefitsInfo key="hasBenefits" />,
  acuteHHConditions: <ConfirmationAcuteConditions key="acuteHHConditions" />,
  referralSource: <ConfirmationReferralSource key="referralSource" />,
  energyCalculatorElectricityProvider: (
    <EnergyCalculatorElectricityProvider key="energyCalculatorElectricityProvider" />
  ),
  energyCalculatorGasProvider: <EnergyCalculatorGasProvider key="energyCalculatorGasProvider" />,
  energyCalculatorExpenses: <EnergyCalculatorExpenses key="energyCalculatorExpenses" />,
  energyCalculatorUtilityStatus: <EnergyCalculatorUtilityStatus key="energyCalculatorUtilityStatus" />,
  energyCalculatorApplianceStatus: <EnergyCalculatorApplianceStatus key="energyCalculatorApplianceStatus" />,
  signUpInfo: null,
};

export default STEP_CONFIRMATIONS;
