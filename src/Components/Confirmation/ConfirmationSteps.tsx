import { ReactNode, useContext, useMemo } from 'react';
import { Context } from '../Wrapper/Wrapper';
import ConfirmationBlock, { ConfirmationItem, formatToUSD, ConfirmationSection } from './ConfirmationBlock';
import { ReactComponent as Residence } from '../../Assets/icons/General/residence.svg';
import { ReactComponent as Household } from '../../Assets/icons/General/household.svg';
import { ReactComponent as Expense } from '../../Assets/icons/General/expenses.svg';
import { ReactComponent as Resources } from '../../Assets/icons/General/resources.svg';
import { ReactComponent as Benefits } from '../../Assets/icons/General/benefits.svg';
import { ReactComponent as Immediate } from '../../Assets/icons/General/alert.svg';
import { ReactComponent as Referral } from '../../Assets/icons/General/referral.svg';
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

  return (
    <ConfirmationBlock
      icon={<Residence />}
      title={<FormattedMessage id="confirmation.residenceInfo" defaultMessage="Basic Information" />}
      editAriaLabel={editZipAriaLabel}
      stepName="zipcode"
      noReturn={getReferrer('uiOptions').includes('no_confirmation_return_zipcode')}
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
          {' '}<span className="household-member-count">
            <span className="household-member-count-full">({householdSizeText})</span>
            <span className="household-member-count-short">({translateNumber(householdSize)})</span>
          </span>
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
  const expenseOptionsByCategory = useConfig<Record<string, FormattedMessageMap>>('expense_options_by_category');
  const expenseOptions = useMemo(
    () => Object.fromEntries(Object.values(expenseOptionsByCategory).flatMap(Object.entries)) as FormattedMessageMap,
    [expenseOptionsByCategory],
  );

  const editExpensesAriaLabel = {
    id: 'confirmation.expense.edit-AL',
    defaultMessage: 'edit expenses',
  };

  const editAssetsAriaLabel = {
    id: 'confirmation.assets.edit-AL',
    defaultMessage: 'edit household resources',
  };

  const allExpenses = () => {
    if (formData.expenses.length === 0) {
      return <ConfirmationItem value={<FormattedMessage id="confirmation.none" defaultMessage="None" />} />;
    }
    const mappedExpenses = formData.expenses.map((expense, i) => {
      const frequencyLabel =
        expense.expenseFrequency === 'yearly'
          ? formatMessage({ id: 'confirmation.expense.perYear', defaultMessage: 'year' })
          : formatMessage({ id: 'confirmation.expense.perMonth', defaultMessage: 'month' });
      return (
        <ConfirmationItem
          label={<>{expenseOptions[expense.expenseSourceName]}:</>}
          value={`${translateNumber(formatToUSD(expense.expenseAmount))} / ${frequencyLabel}`}
          key={i}
        />
      );
    });

    return mappedExpenses;
  };

  return (
    <ConfirmationBlock
      icon={<Expense title={formatMessage(expensesIconAlt)} />}
      title={
        <FormattedMessage
          id="confirmation.headOfHouseholdDataBlock-expensesLabel"
          defaultMessage="Household Expenses"
        />
      }
      editAriaLabel={editExpensesAriaLabel}
      stepName="hasExpenses"
    >
      {allExpenses()}
    </ConfirmationBlock>
  );
}

function Assets() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();

  const editAssetsAriaLabel = {
    id: 'confirmation.assets.edit-AL',
    defaultMessage: 'edit assets',
  };
  const assetsIconAlt = {
    id: 'confirmation.assets.icon-AL',
    defaultMessage: 'assets',
  };

  return (
    <ConfirmationBlock
      icon={<Resources title={formatMessage(assetsIconAlt)} />}
      title={
        <FormattedMessage
          id="confirmation.displayAllFormData-householdResourcesText"
          defaultMessage="Household resources"
        />
      }
      editAriaLabel={editAssetsAriaLabel}
      stepName="householdAssets"
    >
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
            </i>
          </>
        }
      />
    </ConfirmationBlock>
  );
}

function HasBenefits() {
  const { formData, hasBenefitsPrograms } = useContext(Context);
  const { formatMessage } = useIntl();

  const alreadyHasBenefits = () => {
    const selectedKeys = Array.from(formData.benefits);

    if (selectedKeys.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    const programsByKey = new Map(hasBenefitsPrograms.map((p) => [p.name_abbreviated, p]));

    // Only the active white label's programs are in hasBenefitsPrograms; a
    // selected name not offered here is dropped so the user sees one row per
    // program they actually receive in this white label.
    const matched = selectedKeys
      .map((key) => ({ key, program: programsByKey.get(key) }))
      .filter((entry): entry is { key: string; program: HasBenefitsProgram } => entry.program !== undefined);

    if (matched.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    return matched.map(({ key, program }) => (
      <ConfirmationItem
        key={key}
        label={<FormattedMessage id={program.name.label} defaultMessage={program.name.default_message} />}
        value={
          <FormattedMessage
            id={program.website_description.label}
            defaultMessage={program.website_description.default_message}
          />
        }
      />
    ));
  };

  const editHasBenefitsAriaLabel = {
    id: 'confirmation.currentBenefits.edit-AL',
    defaultMessage: 'edit benefits you already have',
  };
  const hasBenefitsIconAlt = {
    id: 'confirmation.currentBenefits.icon-AL',
    defaultMessage: 'benefits you already have',
  };

    return (
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-currentHHBenefitsText" defaultMessage="Current Household Benefits" />}
        value={benefitsList.length > 0 ? benefitsList.map((benefit, i) => <div key={i}>{benefit}</div>) : <FormattedMessage id="confirmation.none" defaultMessage="None" />}
        editLink={
          <Link
            to={`/${whiteLabel}/${uuid}/step-${useStepNumber('hasBenefits')}`}
            state={{ routedFromConfirmationPg: true }}
            className="edit-button-simple"
            aria-label={formatMessage(editHasBenefitsAriaLabel)}
          >
            <Edit title={formatMessage(editHasBenefitsAriaLabel)} />
          </Link>
        }
      />
    );
  };

  const acuteConditionsContent = () => {
    const allNeeds = Object.entries(formData.acuteHHConditions).filter(([_, value]) => value === true);

    return (
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.displayAllFormData-acuteHHConditions" defaultMessage="Additional Resources" />}
        value={
          allNeeds.length === 0 ? (
            <FormattedMessage id="confirmation.noIncome" defaultMessage="None" />
          ) : (
            <ul className="confirmation-acute-need-list">
              {allNeeds.map(([key, _]) => (
                <li key={key}>{acuteConditionOptions[key].text}</li>
              ))}
            </ul>
          )
        }
        editLink={
          <Link
            to={`/${whiteLabel}/${uuid}/step-${useStepNumber('acuteHHConditions')}`}
            state={{ routedFromConfirmationPg: true }}
            className="edit-button-simple"
            aria-label={formatMessage(editAcuteConditionsAriaLabel)}
          >
            <Edit title={formatMessage(editAcuteConditionsAriaLabel)} />
          </Link>
        }
      />
    );
  };

  return (
    <ConfirmationBlock
      icon={<Immediate title={formatMessage(acuteConditionsIconAlt)} />}
      title={
        <FormattedMessage
          id="confirmation.displayAllFormData-acuteHHConditions"
          defaultMessage="Additional Resources"
        />
      }
      editAriaLabel={editAcuteConditionsAriaLabel}
      stepName="acuteHHConditions"
    >
      {formatedNeeds()}
    </ConfirmationBlock>
  );
}

function ReferralSource() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const { allOptions, loading } = useReferralOptions();

  if (formData.referralSource === undefined || loading) {
    return null;
  }

  const editReferralSourceAriaLabel = {
    id: 'confirmation.referralSource.edit-AL',
    defaultMessage: 'edit referral source',
  };
  const referralSourceIconAlt = {
    id: 'confirmation.referralSource.icon-AL',
    defaultMessage: 'referral source',
  };

  // If not a known code, the user typed custom text via the "other" path.
  // Referrer.tsx stores that text directly in referralSource, so display it verbatim.
  const displayValue =
    formData.referralSource in allOptions
      ? formatMessage({
          id: `referralOptions.${formData.referralSource}`,
          defaultMessage: allOptions[formData.referralSource],
        })
      : formData.referralSource;

  return (
    <ConfirmationBlock
      icon={<Referral title={formatMessage(referralSourceIconAlt)} />}
      title={
        <FormattedMessage id="confirmation.displayAllFormData-referralSourceText" defaultMessage="Referral Source" />
      }
      editAriaLabel={editReferralSourceAriaLabel}
      stepName="referralSource"
    >
      <ConfirmationItem value={displayValue} />
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
