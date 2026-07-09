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

function HouseholdSize() {
  const { formData } = useContext(Context);
  const { householdSize } = formData;
  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();

  const householdSizeText = `${translateNumber(householdSize)} ${formatMessage(
    { id: 'confirmation.householdSizeLabel', defaultMessage: '{count, plural, one {person} other {people}}' },
    { count: householdSize },
  )}`;

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
      icon={<Icon name="users" className="confirmation-lucide-icon" aria-label={formatMessage(householdSizeIconAlt)} />}
      title={
        <FormattedMessage id="confirmation.displayAllFormData-yourHouseholdLabel" defaultMessage="Household Members" />
      }
      editAriaLabel={editHouseholdSizeAriaLabel}
      stepName="householdSize"
      noReturn
    >
      <ConfirmationItem
        label={<FormattedMessage id="confirmation.householdSize-inputLabel" defaultMessage="Household Size:" />}
        value={householdSizeText}
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
      icon={<Icon name="receipt" className="confirmation-lucide-icon" aria-label={formatMessage(expensesIconAlt)} />}
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
      icon={<Icon name="piggy-bank" className="confirmation-lucide-icon" aria-label={formatMessage(assetsIconAlt)} />}
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
    <ConfirmationBlock
      icon={<Icon name="shield-check" className="confirmation-lucide-icon" aria-label={formatMessage(hasBenefitsIconAlt)} />}
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
            {allNeeds.map(([key, _]) => {
              const option = acuteConditionOptions[key];
              const label =
                option?.text?.props && 'id' in option.text.props
                  ? formatMessage({ ...option.text.props })
                  : key;
              return <li key={key}>{label}</li>;
            })}
          </ul>
        }
      />
    );
  };

  return (
    <ConfirmationBlock
      icon={<Icon name="triangle-alert" className="confirmation-lucide-icon" aria-label={formatMessage(acuteConditionsIconAlt)} />}
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

  const displayValue =
    formData.referralSource in allOptions
      ? formatMessage({
          id: `referralOptions.${formData.referralSource}`,
          defaultMessage: allOptions[formData.referralSource],
        })
      : formData.referralSource;

  return (
    <ConfirmationBlock
      icon={<Icon name="share-2" className="confirmation-lucide-icon" aria-label={formatMessage(referralSourceIconAlt)} />}
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
