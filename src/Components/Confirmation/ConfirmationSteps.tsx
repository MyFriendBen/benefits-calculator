import { ReactNode, useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import ConfirmationBlock, { ConfirmationItem, formatToUSD, ConfirmationSection } from './ConfirmationBlock';
import { ReactComponent as Residence } from '../../Assets/icons/General/residence.svg';
import { ReactComponent as Household } from '../../Assets/icons/General/household.svg';
import { ReactComponent as Expense } from '../../Assets/icons/General/expenses.svg';
import { ReactComponent as Resources } from '../../Assets/icons/General/resources.svg';
import { ReactComponent as Benefits } from '../../Assets/icons/General/benefits.svg';
import { ReactComponent as Immediate } from '../../Assets/icons/General/alert.svg';
import { ReactComponent as Referral } from '../../Assets/icons/General/referral.svg';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { FormattedMessageType, QuestionName } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import DefaultConfirmationHHData from './ConfirmationHouseholdData';
import EnergyCalcConfirmationHHData from '../EnergyCalculator/ConfirmationPage/HouseholdData';
import { Benefits as BenefitsType } from '../../Types/FormData';
import EnergyCalculatorElectricityProvider from '../EnergyCalculator/ConfirmationPage/ElectricityProvider';
import EnergyCalculatorGasProvider from '../EnergyCalculator/ConfirmationPage/GasProvider';
import EnergyCalculatorExpenses from '../EnergyCalculator/ConfirmationPage/Expenses';
import EnergyCalculatorUtilityStatus from '../EnergyCalculator/ConfirmationPage/UtilityStatus';
import EnergyCalculatorApplianceStatus from '../EnergyCalculator/ConfirmationPage/ApplianceStatus';

function ZipCode() {
  const { formData, getReferrer } = useContext(Context);
  const { zipcode, county } = formData;
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();

  const editZipAriaLabel = {
    id: 'confirmation.zipcode.edit-AL',
    defaultMessage: 'edit zipcode',
  };

  return (
    <ConfirmationBlock
      icon={<Residence />}
      title={<FormattedMessage id="confirmation.residenceInfo" defaultMessage="Basic Information" />}
      editAriaLabel={editZipAriaLabel}
      stepName="zipcode"
      noReturn={getReferrer('featureFlags').includes('no_confirmation_return_zipcode')}
    >
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-zipcodeText" defaultMessage="Zip Code" />}
        value={translateNumber(zipcode)}
      />
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-countyText" defaultMessage="County" />}
        value={county}
      />
    </ConfirmationBlock>
  );
}

function HouseholdSize() {
  const { formData, locale } = useContext(Context);
  const { householdSize } = formData;
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();

  let householdSizeDescriptor = { id: 'confirmation.displayAllFormData-personLabel', defaultMessage: 'person' };

  if (householdSize >= 2) {
    householdSizeDescriptor = { id: 'confirmation.displayAllFormData-peopleLabel', defaultMessage: 'people' };
    // Russian uses the singular of people for 1-4 people
    if (householdSize <= 4 && locale === 'ru') {
      householdSizeDescriptor = { id: 'confirmation.displayAllFormData-personLabel', defaultMessage: 'person' };
    }
  }

  const editHouseholdSizeAriaLabel = {
    id: 'confirmation.hhSize.edit-AL',
    defaultMessage: 'edit household size',
  };

  const householdSizeText = `${translateNumber(householdSize)} ${formatMessage(householdSizeDescriptor)}`;

  return (
    <ConfirmationBlock
      icon={<Household />}
      title={
        <>
          <FormattedMessage id="confirmation.displayAllFormData-yourHouseholdLabel" defaultMessage="Household Members" />
          {' '}({householdSizeText})
        </>
      }
      editAriaLabel={editHouseholdSizeAriaLabel}
      stepName="householdSize"
      noReturn
    >
      {/* No content needed since size is in the header */}
    </ConfirmationBlock>
  );
}

type FormattedMessageMap = {
  [key: string]: FormattedMessageType;
};

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

function Expenses() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();
  const expenseOptions = useConfig<FormattedMessageMap>('expense_options');

  const editExpensesAriaLabel = {
    id: 'confirmation.expense.edit-AL',
    defaultMessage: 'edit expenses',
  };

  const allExpenses = () => {
    if (formData.expenses.length === 0) {
      return <ConfirmationItem label={<FormattedMessage id="confirmation.headOfHouseholdDataBlock-expensesLabel" defaultMessage="Monthly Household Expenses" />} value={<FormattedMessage id="confirmation.none" defaultMessage="None" />} />;
    }
    const mappedExpenses = formData.expenses.map((expense, i) => {
      return (
        <ConfirmationItem
          label={expenseOptions[expense.expenseSourceName]}
          value={translateNumber(formatToUSD(Number(expense.expenseAmount)))}
          key={i}
        />
      );
    });

    return mappedExpenses;
  };

  const assetsContent = () => {
    return (
      <ConfirmationItem
        label={
          <FormattedMessage
            id="confirmation.displayAllFormData-householdResourcesText"
            defaultMessage="Household Resources"
          />
        }
        value={
          <>
            {translateNumber(formatToUSD(formData.householdAssets, 0))}
            <br />
            <small style={{ fontStyle: 'italic', color: '#666' }}>
              <FormattedMessage
                id="confirmation.displayAllFormData-householdResourcesDescription"
                defaultMessage="This is cash on hand/in checking or savings accounts, stocks, bonds or mutual funds."
              />
            </small>
          </>
        }
      />
    );
  };

  return (
    <ConfirmationBlock
      icon={<Resources />}
      title={
        <FormattedMessage
          id="confirmation.financialInfo"
          defaultMessage="Financial Information"
        />
      }
      editAriaLabel={editExpensesAriaLabel}
      stepName="hasExpenses"
    >
      {allExpenses()}
      {assetsContent()}
    </ConfirmationBlock>
  );
}

type BenefitList = {
  [key: string]: {
    name: FormattedMessageType;
    description: FormattedMessageType;
  };
};

type CategoryBenefits = {
  [key: string]: { benefits: BenefitList; category_name: FormattedMessageType };
};

function HasBenefits() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const categoryBenefits = useConfig<CategoryBenefits>('category_benefits');
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');
  const referralOptions = useConfig<{ [key: string]: string | FormattedMessageType }>('referral_options');

  const alreadyHasBenefits = () => {
    let allBenefits: BenefitList = {};

    for (const category of Object.values(categoryBenefits)) {
      allBenefits = { ...allBenefits, ...category.benefits };
    }

    const benefitsText = Object.entries(allBenefits)
      .filter(([name, _]) => {
        return formData.benefits[name as keyof BenefitsType];
      })
      .map(([name, value]) => {
        return <ConfirmationItem label={value.name} value={value.description} key={name} />;
      });

    if (benefitsText.length > 0) {
      return benefitsText;
    }

    return <ConfirmationItem label={<FormattedMessage id="confirmation.displayAllFormData-currentHHBenefitsText" defaultMessage="Current Household Benefits" />} value={<FormattedMessage id="confirmation.none" defaultMessage="None" />} />;
  };

  const acuteConditionsContent = () => {
    const allNeeds = Object.entries(formData.acuteHHConditions).filter(([_, value]) => value === true);

    if (allNeeds.length === 0) {
      return <ConfirmationItem label={<FormattedMessage id="confirmation.displayAllFormData-acuteHHConditions" defaultMessage="Additional Resources" />} value={<FormattedMessage id="confirmation.noIncome" defaultMessage="None" />} />;
    }

    return (
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-acuteHHConditions" defaultMessage="Additional Resources" />}
        value={
          <ul className="confirmation-acute-need-list">
            {allNeeds.map(([key, _]) => (
              <li key={key}>{acuteConditionOptions[key].text}</li>
            ))}
          </ul>
        }
      />
    );
  };

  const referralSourceContent = () => {
    if (formData.referralSource === undefined) {
      return null;
    }

    return (
      <ConfirmationItem
        label={
          <FormattedMessage id="confirmation.displayAllFormData-referralSourceText" defaultMessage="Referral Source" />
        }
        value={
          formData.referralSource in referralOptions
            ? referralOptions[formData.referralSource]
            : formData.referralSource
        }
      />
    );
  };

  const editHasBenefitsAriaLabel = {
    id: 'confirmation.currentBenefits.edit-AL',
    defaultMessage: 'edit benefits you already have',
  };

  return (
    <ConfirmationBlock
      icon={<Benefits />}
      title={
        <FormattedMessage
          id="confirmation.benefitsAdditionalInfo"
          defaultMessage="Benefits & Additional Information"
        />
      }
      editAriaLabel={editHasBenefitsAriaLabel}
      stepName="hasBenefits"
    >
      {alreadyHasBenefits()}
      {acuteConditionsContent()}
      {referralSourceContent()}
    </ConfirmationBlock>
  );
}

function AcuteConditions() {
  return null;
}

function ReferralSource() {
  return null;
}

const STEP_CONFIRMATIONS: Record<QuestionName, ReactNode | null> = {
  zipcode: <ZipCode key="zipcode" />,
  householdSize: <HouseholdSize key="householdSize" />,
  energyCalculatorHouseholdData: <EnergyCalcConfirmationHHData key="energyCalculatorHouseholdData" />,
  householdData: <DefaultConfirmationHHData key="householdData" />,
  hasExpenses: <Expenses key="hasExpenses" />,
  householdAssets: null,
  hasBenefits: <HasBenefits key="hasBenefits" />,
  acuteHHConditions: null,
  referralSource: null,
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
