import { ReactNode, useContext, useMemo } from 'react';
import { Context } from '../Wrapper/Wrapper';
import ConfirmationBlock, { ConfirmationItem, formatToUSD } from './ConfirmationBlock';
import { ReactComponent as Residence } from '../../Assets/icons/General/residence.svg';
import { ReactComponent as Resources } from '../../Assets/icons/General/resources.svg';
import { ReactComponent as Benefits } from '../../Assets/icons/General/benefits.svg';
import { ReactComponent as Edit } from '../../Assets/icons/General/edit.svg';
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
import { Link, useParams } from 'react-router-dom';
import { useStepNumber } from '../../Assets/stepDirectory';

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
      icon={<Residence title={formatMessage(zipcodeIconAlt)} />}
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
  const { whiteLabel, uuid } = useParams();
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();
  const expenseOptionsByCategory = useConfig<Record<string, FormattedMessageMap>>('expense_options_by_category');
  const expenseOptions = useMemo(
    () => Object.fromEntries(Object.values(expenseOptionsByCategory).flatMap(Object.entries)) as FormattedMessageMap,
    [expenseOptionsByCategory],
  );

  const expensesStepNumber = useStepNumber('hasExpenses');
  const assetsStepNumber = useStepNumber('householdAssets');

  const financialInfoIconAlt = {
    id: 'confirmation.financialInfo.icon-AL',
    defaultMessage: 'financial information',
  };

  const editExpensesAriaLabel = {
    id: 'confirmation.expense.edit-AL',
    defaultMessage: 'edit expenses',
  };
  const editAssetsAriaLabel = {
    id: 'confirmation.assets.edit-AL',
    defaultMessage: 'edit assets',
  };

  const expensesDisplay = () => {
    if (formData.expenses.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }
    return (
      <ul className="confirmation-expense-list">
        {formData.expenses.map((expense, index) => {
          const frequencyLabel =
            expense.expenseFrequency === 'yearly'
              ? formatMessage({ id: 'confirmation.expense.perYear', defaultMessage: 'year' })
              : formatMessage({ id: 'confirmation.expense.perMonth', defaultMessage: 'month' });

          // Get the expense name and simplify "(Non-Subsidized)" to just the base name
          let expenseName = expenseOptions[expense.expenseSourceName]?.props?.defaultMessage || expense.expenseSourceName;
          expenseName = expenseName.replace(/\s*\(Non-Subsidized\)\s*/gi, '');

          return (
            <li key={index}>
              {expenseName}: {translateNumber(formatToUSD(expense.expenseAmount, 2))}
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
          <div className="confirmation-icon">
            <Resources title={formatMessage(financialInfoIconAlt)} />
          </div>
          <FormattedMessage id="confirmation.financialInfo" defaultMessage="Financial Information" />
        </h2>
      </div>
      <div className="simple-section-content">
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.monthlyHouseholdExpenses"
              defaultMessage="Monthly Household Expenses:"
            />
          }
          value={expensesDisplay()}
          editLink={
            <Link
              to={`/${whiteLabel}/${uuid}/step-${expensesStepNumber}/`}
              state={{ routedFromConfirmationPg: true }}
              className="edit-button-simple"
              aria-label={formatMessage(editExpensesAriaLabel)}
            >
              <Edit title={formatMessage(editExpensesAriaLabel)} />
            </Link>
          }
        />
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.householdResources"
              defaultMessage="Household resources:"
            />
          }
          value={
            <>
              {translateNumber(formatToUSD(formData.householdAssets, 0))}
              <br />
              <i>
                <FormattedMessage
                  id="confirmation.displayAllFormData-householdResourcesDescription"
                  defaultMessage="(This is cash on hand, checking or saving accounts, stocks, bonds or mutual funds.)"
                />
              </i>
            </>
          }
          editLink={
            <Link
              to={`/${whiteLabel}/${uuid}/step-${assetsStepNumber}/`}
              state={{ routedFromConfirmationPg: true }}
              className="edit-button-simple"
              aria-label={formatMessage(editAssetsAriaLabel)}
            >
              <Edit title={formatMessage(editAssetsAriaLabel)} />
            </Link>
          }
        />
      </div>
    </div>
  );
}

function BenefitsAndAdditionalInfo() {
  const { formData, hasBenefitsPrograms } = useContext(Context);
  const { whiteLabel, uuid } = useParams();
  const { formatMessage } = useIntl();
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');
  const { allOptions: referralOptions, loading: referralLoading } = useReferralOptions();

  const hasBenefitsStepNumber = useStepNumber('hasBenefits');
  const acuteConditionsStepNumber = useStepNumber('acuteHHConditions');
  const referralSourceStepNumber = useStepNumber('referralSource');

  const benefitsIconAlt = {
    id: 'confirmation.benefitsAndAdditionalInfo.icon-AL',
    defaultMessage: 'benefits and additional information',
  };
  const editHasBenefitsAriaLabel = {
    id: 'confirmation.currentBenefits.edit-AL',
    defaultMessage: 'edit benefits you already have',
  };
  const editAcuteConditionsAriaLabel = {
    id: 'confirmation.acuteConditions.edit-AL',
    defaultMessage: 'edit immediate needs',
  };
  const editReferralSourceAriaLabel = {
    id: 'confirmation.referralSource.edit-AL',
    defaultMessage: 'edit referral source',
  };

  // Current Benefits Display
  const currentBenefitsDisplay = () => {
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

    return matched
      .map(({ program }) => formatMessage({ id: program.name.label, defaultMessage: program.name.default_message }))
      .join(', ');
  };

  // Acute Conditions Display
  const acuteConditionsDisplay = () => {
    const allNeeds = Object.entries(formData.acuteHHConditions).filter(([_, value]) => value === true);
    if (allNeeds.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    return (
      <ul className="confirmation-acute-need-list">
        {allNeeds.map(([key, _], index) => {
          const option = acuteConditionOptions[key];
          return <li key={index}>{option?.text?.props?.defaultMessage || key}</li>;
        })}
      </ul>
    );
  };

  // Referral Source Display
  const referralSourceDisplay = () => {
    if (formData.referralSource === undefined || referralLoading) {
      return null;
    }

    return formData.referralSource in referralOptions
      ? formatMessage({
          id: `referralOptions.${formData.referralSource}`,
          defaultMessage: referralOptions[formData.referralSource],
        })
      : formData.referralSource;
  };

  const showReferralSource = formData.referralSource !== undefined && !referralLoading;

  return (
    <div className="simple-confirmation-section">
      <div className="simple-section-header">
        <h2>
          <div className="confirmation-icon">
            <Benefits title={formatMessage(benefitsIconAlt)} />
          </div>
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
              id="confirmation.currentHouseholdBenefits"
              defaultMessage="Current Household Benefits:"
            />
          }
          value={currentBenefitsDisplay()}
          editLink={
            <Link
              to={`/${whiteLabel}/${uuid}/step-${hasBenefitsStepNumber}/`}
              state={{ routedFromConfirmationPg: true }}
              className="edit-button-simple"
              aria-label={formatMessage(editHasBenefitsAriaLabel)}
            >
              <Edit title={formatMessage(editHasBenefitsAriaLabel)} />
            </Link>
          }
        />
        <ConfirmationItem
          label={
            <FormattedMessage
              id="confirmation.additionalResources"
              defaultMessage="Additional Resources:"
            />
          }
          value={acuteConditionsDisplay()}
          editLink={
            <Link
              to={`/${whiteLabel}/${uuid}/step-${acuteConditionsStepNumber}/`}
              state={{ routedFromConfirmationPg: true }}
              className="edit-button-simple"
              aria-label={formatMessage(editAcuteConditionsAriaLabel)}
            >
              <Edit title={formatMessage(editAcuteConditionsAriaLabel)} />
            </Link>
          }
        />
        {showReferralSource && (
          <ConfirmationItem
            label={
              <FormattedMessage id="confirmation.referralSource" defaultMessage="Referral Source:" />
            }
            value={referralSourceDisplay()}
            editLink={
              <Link
                to={`/${whiteLabel}/${uuid}/step-${referralSourceStepNumber}/`}
                state={{ routedFromConfirmationPg: true }}
                className="edit-button-simple"
                aria-label={formatMessage(editReferralSourceAriaLabel)}
              >
                <Edit title={formatMessage(editReferralSourceAriaLabel)} />
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

const STEP_CONFIRMATIONS: Record<QuestionName, ReactNode | null> = {
  zipcode: <ZipCode key="zipcode" />,
  householdSize: null, // Now included in householdData section header
  householdData: <DefaultConfirmationHHData key="householdData" />,
  hasExpenses: <FinancialInfo key="financialInfo" />,
  householdAssets: null, // Now part of FinancialInfo
  hasBenefits: <BenefitsAndAdditionalInfo key="benefitsAndAdditionalInfo" />,
  acuteHHConditions: null, // Now part of BenefitsAndAdditionalInfo
  referralSource: null, // Now part of BenefitsAndAdditionalInfo
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
