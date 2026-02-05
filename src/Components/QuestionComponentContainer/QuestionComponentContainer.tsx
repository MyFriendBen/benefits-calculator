import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Zipcode } from '../Steps/Zipcode';
import Expenses from '../Steps/Expenses/Expenses';
import HouseholdSize from '../Steps/HouseholdSize/HouseholdSize';
import { useStepName } from '../../Assets/stepDirectory';
import ReferralSourceStep from '../Steps/Referrer';
import { OTHER_PAGE_TITLES, QUESTION_TITLES } from '../../Assets/pageTitleTags';
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

const QuestionComponentContainer = () => {
  let { id } = useParams();

  if (id === undefined) {
    throw new Error('steps must have a step-[id]');
  }
  const questionName = useStepName(+id);

  const pageTitle = questionName === undefined ? OTHER_PAGE_TITLES.default : QUESTION_TITLES[questionName];
  usePageTitle(pageTitle)

  switch (questionName) {
    case 'zipcode':
      return (
        <main className="benefits-form">
          <Zipcode />
        </main>
      );
    case 'householdSize':
      return (
        <main className="benefits-form">
          <HouseholdSize />
        </main>
      );
    case 'hasExpenses':
      return (
        <main className="benefits-form">
          <Expenses />
        </main>
      );
    case 'householdAssets':
      return (
        <main className="benefits-form">
          <HouseholdAssets />
        </main>
      );
    case 'hasBenefits':
      return (
        <main className="benefits-form">
          <AlreadyHasBenefits />
        </main>
      );
    case 'acuteHHConditions':
      return (
        <main className="benefits-form">
          <ImmediateNeeds />
        </main>
      );
    case 'referralSource':
      return (
        <main className="benefits-form">
          <ReferralSourceStep />
        </main>
      );
    case 'signUpInfo':
      return (
        <main className="benefits-form">
          <SignUp />
        </main>
      );
    case 'energyCalculatorElectricityProvider':
      return (
        <main className="benefits-form">
          <ElectricityProvider />
        </main>
      );
    case 'energyCalculatorGasProvider':
      return (
        <main className="benefits-form">
          <GasProvider />
        </main>
      );
    case 'energyCalculatorExpenses':
      return (
        <main className="benefits-form">
          <EnergyCalculatorExpenses />
        </main>
      );
    case 'energyCalculatorApplianceStatus':
      return (
        <main className="benefits-form">
          <Appliances />
        </main>
      );
    case 'energyCalculatorUtilityStatus':
      return (
        <main className="benefits-form">
          <Utilities />
        </main>
      );
    case 'energyCalculatorApplianceStatus':
      return (
        <main className="benefits-form">
          <Appliances />
        </main>
      );
  }

  return null;
};

export default QuestionComponentContainer;
