import { ReactNode, useContext, useMemo } from 'react';
import { Context } from '../Wrapper/Wrapper';
import ConfirmationBlock, { ConfirmationItem, formatToUSD } from './ConfirmationBlock';
import { Icon } from '../Icon/Icon';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { FormattedMessageType, QuestionName } from '../../Types/Questions';
import { HasBenefitsProgram } from '../../Types/ApiCalls';
import { useConfig } from '../Config/configHook';
import { useReferralOptions } from '../../hooks/useReferralOptions';
import DefaultConfirmationHHData from './ConfirmationHouseholdData';
import EnergyCalculatorElectricityProvider from '../EnergyCalculator/ConfirmationPage/ElectricityProvider';
import EnergyCalculatorGasProvider from '../EnergyCalculator/ConfirmationPage/GasProvider';
import EnergyCalculatorExpenses from '../EnergyCalculator/ConfirmationPage/Expenses';
import EnergyCalculatorUtilityStatus from '../EnergyCalculator/ConfirmationPage/UtilityStatus';
import EnergyCalculatorApplianceStatus from '../EnergyCalculator/ConfirmationPage/ApplianceStatus';
import { Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useStepNumber } from '../../Assets/stepDirectory';

function RowEditLink({ stepName, ariaLabel }: { stepName: QuestionName; ariaLabel: string }) {
  const { whiteLabel, uuid } = useParams();
  const stepNumber = useStepNumber(stepName, false);

  if (stepNumber === -1) {
    return null;
  }

  return (
    <Link
      to={`/${whiteLabel}/${uuid}/step-${stepNumber}/`}
      state={{ routedFromConfirmationPg: true }}
      className="edit-button-simple"
      aria-label={ariaLabel}
    >
      <Pencil aria-hidden={true} />
    </Link>
  );
}

function ZipCode() {
  const { formData, getReferrer } = useContext(Context);
  const { zipcode, county } = formData;
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();

  const editZipAriaLabel = {
    id: 'confirmation.zipcode.edit-AL',
    defaultMessage: 'edit zipcode',
  };
  const zipcodeIconAlt = {
    id: 'confirmation.zipcode.icon-AL',
    defaultMessage: 'zipcode',
  };

  return (
    <ConfirmationBlock
      icon={<Icon name="house" className="confirmation-lucide-icon" aria-label={formatMessage(zipcodeIconAlt)} />}
      title={<FormattedMessage id="confirmation.residenceInfo" defaultMessage="Residence Information" />}
      editAriaLabel={editZipAriaLabel}
      stepName="zipcode"
      noReturn={getReferrer('uiOptions').includes('no_confirmation_return_zipcode')}
    >
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-zipcodeText" defaultMessage="Zip code: " />}
        value={translateNumber(zipcode)}
      />
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-countyText" defaultMessage="County: " />}
        value={county}
      />
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

function FinancialInfo() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();
  const expenseOptionsByCategory = useConfig<Record<string, FormattedMessageMap>>('expense_options_by_category');
  const expenseOptions = useMemo(
    () => Object.fromEntries(Object.values(expenseOptionsByCategory).flatMap(Object.entries)) as FormattedMessageMap,
    [expenseOptionsByCategory],
  );

  const expensesValue = () => {
    if (formData.expenses.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }
    return (
      <ul className="confirmation-expense-list">
        {formData.expenses.map((expense, i) => {
          const frequencyLabel =
            expense.expenseFrequency === 'yearly'
              ? formatMessage({ id: 'confirmation.expense.perYear', defaultMessage: 'year' })
              : formatMessage({ id: 'confirmation.expense.perMonth', defaultMessage: 'month' });
          const expenseName =
            expenseOptions[expense.expenseSourceName]?.props && 'id' in expenseOptions[expense.expenseSourceName].props
              ? formatMessage({ ...expenseOptions[expense.expenseSourceName].props })
              : expense.expenseSourceName;
          return (
            <li key={i}>
              {expenseName}: {translateNumber(formatToUSD(expense.expenseAmount))} / {frequencyLabel}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="simple-confirmation-section">
      <div className="simple-section-header">
        <h2>
          <Icon
            name="receipt"
            aria-label={formatMessage({
              id: 'confirmation.financialInfo.icon-AL',
              defaultMessage: 'financial information',
            })}
          />
          <FormattedMessage id="confirmation.financialInfo" defaultMessage="Financial Information" />
        </h2>
      </div>
      <div className="simple-section-content">
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.headOfHouseholdDataBlock-expensesLabel"
              defaultMessage="Household Expenses"
            />
          }
          value={expensesValue()}
          editLink={
            <RowEditLink
              stepName="hasExpenses"
              ariaLabel={formatMessage({ id: 'confirmation.expense.edit-AL', defaultMessage: 'edit expenses' })}
            />
          }
        />
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.displayAllFormData-householdResourcesText"
              defaultMessage="Household resources"
            />
          }
          value={
            <>
              {translateNumber(formatToUSD(formData.householdAssets, 0))}
              <i>
                <FormattedMessage
                  id="confirmation.displayAllFormData-householdResourcesDescription"
                  defaultMessage="(This is cash on hand, checking or saving accounts, stocks, bonds or mutual funds.)"
                />
              </i>
            </>
          }
          editLink={
            <RowEditLink
              stepName="householdAssets"
              ariaLabel={formatMessage({ id: 'confirmation.assets.edit-AL', defaultMessage: 'edit assets' })}
            />
          }
        />
      </div>
    </div>
  );
}

function BenefitsAndAdditionalInfo() {
  const { formData, hasBenefitsPrograms } = useContext(Context);
  const { formatMessage } = useIntl();
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');
  const { allOptions, loading } = useReferralOptions();
  const referralSourceStepNumber = useStepNumber('referralSource', false);

  const benefitsValue = () => {
    const selectedKeys = Array.from(formData.benefits);

    if (selectedKeys.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    const programsByKey = new Map(hasBenefitsPrograms.map((p) => [p.name_abbreviated, p]));

    const matched = selectedKeys
      .map((key) => ({ key, program: programsByKey.get(key) }))
      .filter((entry): entry is { key: string; program: HasBenefitsProgram } => entry.program !== undefined);

    if (matched.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    return (
      <ul className="confirmation-expense-list">
        {matched.map(({ key, program }) => (
          <li key={key}>
            <FormattedMessage id={program.name.label} defaultMessage={program.name.default_message} />
          </li>
        ))}
      </ul>
    );
  };

  const acuteConditionsValue = () => {
    const allNeeds = Object.entries(formData.acuteHHConditions).filter(([, value]) => value === true);

    if (allNeeds.length === 0) {
      return <FormattedMessage id="confirmation.noIncome" defaultMessage="None" />;
    }

    return (
      <ul className="confirmation-acute-need-list">
        {allNeeds.map(([key]) => {
          const option = acuteConditionOptions[key];
          const label =
            option?.text?.props && 'id' in option.text.props ? formatMessage({ ...option.text.props }) : key;
          return <li key={key}>{label}</li>;
        })}
      </ul>
    );
  };

  const referralSourceValue = () => {
    if (formData.referralSource === undefined || loading) {
      return null;
    }
    return formData.referralSource in allOptions
      ? formatMessage({
          id: `referralOptions.${formData.referralSource}`,
          defaultMessage: allOptions[formData.referralSource],
        })
      : formData.referralSource;
  };

  return (
    <div className="simple-confirmation-section">
      <div className="simple-section-header">
        <h2>
          <Icon
            name="shield-check"
            aria-label={formatMessage({
              id: 'confirmation.benefitsAndInfo.icon-AL',
              defaultMessage: 'benefits and additional information',
            })}
          />
          <FormattedMessage
            id="confirmation.benefitsAndAdditionalInfo"
            defaultMessage="Benefits & Additional Information"
          />
        </h2>
      </div>
      <div className="simple-section-content">
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.displayAllFormData-currentHHBenefitsText"
              defaultMessage="Current Household Benefits:"
            />
          }
          value={benefitsValue()}
          editLink={
            <RowEditLink
              stepName="hasBenefits"
              ariaLabel={formatMessage({
                id: 'confirmation.currentBenefits.edit-AL',
                defaultMessage: 'edit benefits you already have',
              })}
            />
          }
        />
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.displayAllFormData-acuteHHConditions"
              defaultMessage="Additional Resources"
            />
          }
          value={acuteConditionsValue()}
          editLink={
            <RowEditLink
              stepName="acuteHHConditions"
              ariaLabel={formatMessage({
                id: 'confirmation.acuteConditions.edit-AL',
                defaultMessage: 'edit immediate needs',
              })}
            />
          }
        />
        {formData.referralSource !== undefined && !loading && referralSourceStepNumber !== -1 && (
          <ConfirmationItem
            label={
              <FormattedMessage
                id="confirmation.displayAllFormData-referralSourceText"
                defaultMessage="Referral Source"
              />
            }
            value={referralSourceValue()}
            editLink={
              <RowEditLink
                stepName="referralSource"
                ariaLabel={formatMessage({
                  id: 'confirmation.referralSource.edit-AL',
                  defaultMessage: 'edit referral source',
                })}
              />
            }
          />
        )}
      </div>
    </div>
  );
}

const STEP_CONFIRMATIONS: Record<QuestionName, ReactNode | null> = {
  zipcode: <ZipCode key="zipcode" />,
  householdSize: null,
  householdData: <DefaultConfirmationHHData key="householdData" />,
  hasExpenses: <FinancialInfo key="hasExpenses" />,
  householdAssets: null,
  hasBenefits: <BenefitsAndAdditionalInfo key="hasBenefits" />,
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
