import { ReactNode, useContext, useMemo } from 'react';
import { Context } from '../Wrapper/Wrapper';
import ConfirmationBlock, { ConfirmationItem, formatToUSD } from './ConfirmationBlock';
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
import { useReferralOptions } from '../../hooks/useReferralOptions';
import DefaultConfirmationHHData from './ConfirmationHouseholdData';
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
  const householdSizeIconAlt = {
    id: 'confirmation.hhsize.icon-AL',
    defaultMessage: 'household size',
  };

  return (
    <ConfirmationBlock
      icon={<Household title={formatMessage(householdSizeIconAlt)} />}
      title={
        <FormattedMessage id="confirmation.displayAllFormData-yourHouseholdLabel" defaultMessage="Household Members" />
      }
      editAriaLabel={editHouseholdSizeAriaLabel}
      stepName="householdSize"
      noReturn
    >
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.householdSize-inputLabel" defaultMessage="Household Size:" />}
        value={`${translateNumber(householdSize)} ${formatMessage(householdSizeDescriptor)}`}
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
  const expensesIconAlt = {
    id: 'confirmation.expense.icon-AL',
    defaultMessage: 'expenses',
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
      />
    </ConfirmationBlock>
  );
}

function HasBenefits() {
  const { formData, hasBenefitsPrograms } = useContext(Context);
  const { formatMessage } = useIntl();

  const alreadyHasBenefits = () => {
    // Selected benefit keys, in admin-sorted order from the BE.
    const selectedKeys = Object.entries(formData.benefits)
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => key);

    if (selectedKeys.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    // Match by lowercased name_abbreviated to mirror AlreadyHasBenefits.tsx.
    // TODO(MFB-720): drop the lowercase coercion once the join-table migration ships.
    const programsByKey = new Map(hasBenefitsPrograms.map((p) => [p.name_abbreviated.toLowerCase(), p]));

    return selectedKeys.map((key) => {
      const program = programsByKey.get(key);
      if (program) {
        return (
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
        );
      }
      // Fallback: a benefit was previously selected but is no longer flagged
      // for this step (e.g. admin toggled show_in_has_benefits_step off).
      // Render the raw key so the user can still see what was on file.
      return <ConfirmationItem key={key} value={key} />;
    });
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
    <ConfirmationBlock
      icon={<Benefits title={formatMessage(hasBenefitsIconAlt)} />}
      title={
        <FormattedMessage
          id="confirmation.displayAllFormData-currentHHBenefitsText"
          defaultMessage="Current Household Benefits:"
        />
      }
      editAriaLabel={editHasBenefitsAriaLabel}
      stepName="hasBenefits"
    >
      {alreadyHasBenefits()}
    </ConfirmationBlock>
  );
}

function AcuteConditions() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');

  const editAcuteConditionsAriaLabel = {
    id: 'confirmation.acuteConditions.edit-AL',
    defaultMessage: 'edit immediate needs',
  };
  const acuteConditionsIconAlt = {
    id: 'confirmation.acuteConditions.icon-AL',
    defaultMessage: 'immediate needs',
  };

  const formatedNeeds = () => {
    const allNeeds = Object.entries(formData.acuteHHConditions).filter(([_, value]) => value === true);

    if (allNeeds.length === 0) {
      return <FormattedMessage id="confirmation.noIncome" defaultMessage="None" />;
    }

    return (
      <ConfirmationItem
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
      ? formatMessage({ id: `referralOptions.${formData.referralSource}`, defaultMessage: allOptions[formData.referralSource] })
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

const STEP_CONFIRMATIONS: Record<QuestionName, ReactNode | null> = {
  zipcode: <ZipCode key="zipcode" />,
  householdSize: <HouseholdSize key="householdSize" />,
  householdData: <DefaultConfirmationHHData key="householdData" />,
  hasExpenses: <Expenses key="hasExpenses" />,
  householdAssets: <Assets key="householdAssets" />,
  hasBenefits: <HasBenefits key="hasBenefits" />,
  acuteHHConditions: <AcuteConditions key="acuteHHConditions" />,
  referralSource: <ReferralSource key="referralSource" />,
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
