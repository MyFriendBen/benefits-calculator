import { ReactNode, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ConfirmationBlock, { ConfirmationItem, RowEditLink } from '../../Confirmation/ConfirmationBlock';
import { useStepDirectory } from '../../../Assets/stepDirectory';
import { Context } from '../../Wrapper/Wrapper';
import { Icon } from '../../Icon/Icon';
import { FormattedMessageType, QuestionName } from '../../../Types/Questions';
import { EnergyCalculatorFormData } from '../../../Types/FormData';
import { OTHER_ELECTRIC_PROVIDERS, OTHER_GAS_PROVIDERS } from '../providers';
import { applianceStatusOptions } from '../Steps/Appliances';
import { EnergyCalculatorExpenseType, ENERGY_CALCULATOR_EXPENSE_NAME_MAP } from '../Steps/Expenses';

/**
 * Gathers the energy screener's utility questions under one confirmation
 * heading. Each row carries its own edit link, and RowEditLink drops the row's
 * pencil when that step is absent from the active white label's step directory
 * (the CESN renter path, for example, skips the appliance question).
 */
export default function EnergyCalculatorEnergyInfo() {
  const { formData } = useContext(Context);
  const { energyCalculator } = formData;
  const { formatMessage } = useIntl();
  const stepDirectory = useStepDirectory();
  const asks = (step: QuestionName) => stepDirectory.includes(step);

  const electricProvider = energyCalculator?.electricProvider ?? 'other';
  let electricProviderName: string | FormattedMessageType;
  if (energyCalculator?.electricProviderName) {
    electricProviderName = energyCalculator.electricProviderName;
  } else if (OTHER_ELECTRIC_PROVIDERS[electricProvider]) {
    electricProviderName = OTHER_ELECTRIC_PROVIDERS[electricProvider];
  } else {
    electricProviderName = <FormattedMessage id="energyCalculator.electricityProvider.other" defaultMessage="Other" />;
  }

  const gasProvider = energyCalculator?.gasProvider ?? 'other';
  let gasProviderName: string | FormattedMessageType;
  if (energyCalculator?.gasProviderName) {
    gasProviderName = energyCalculator.gasProviderName;
  } else if (OTHER_GAS_PROVIDERS[gasProvider]) {
    gasProviderName = OTHER_GAS_PROVIDERS[gasProvider];
  } else {
    gasProviderName = <FormattedMessage id="energyCalculator.gasProvider.other" defaultMessage="Other" />;
  }

  const notApplicable = (
    <FormattedMessage id="energyCalculator.confirmation.notApplicable" defaultMessage="Not applicable" />
  );

  const utilityStatusValue = () => {
    const statuses = [
      energyCalculator?.electricityIsDisconnected && (
        <FormattedMessage
          key="disconnected"
          id="energyCalculator.confirmation.energyIsDisconnected"
          defaultMessage="Your electricity and/or gas is currently disconnected"
        />
      ),
      energyCalculator?.hasPastDueEnergyBills && (
        <FormattedMessage
          key="pastDue"
          id="energyCalculator.confirmation.hasPastDueEnergyBills"
          defaultMessage="You have a past-due electric or heating bill or you are low on fuel"
        />
      ),
      energyCalculator?.hasOldCar && (
        <FormattedMessage
          key="oldCar"
          id="energyCalculator.confirmation.hasOldCar"
          defaultMessage="You have a gas or diesel-powered vehicle that is 12+ years old or has failed an emissions test"
        />
      ),
    ].filter(Boolean);

    if (statuses.length === 0) {
      return notApplicable;
    }

    return (
      <ul className="confirmation-acute-need-list">
        {statuses.map((status, i) => (
          <li key={i}>{status}</li>
        ))}
      </ul>
    );
  };

  const applianceStatusValue = () => {
    const truthyApplianceStatuses = Object.entries(applianceStatusOptions).filter(([applianceKey]) => {
      return energyCalculator?.[applianceKey as keyof EnergyCalculatorFormData] === true;
    });

    if (truthyApplianceStatuses.length === 0) {
      return notApplicable;
    }

    return (
      <ul className="confirmation-acute-need-list">
        {truthyApplianceStatuses.map(([applianceStatusName, applianceStatusProps]) => (
          <li key={applianceStatusName}>{applianceStatusProps.text}</li>
        ))}
      </ul>
    );
  };

  const utilityBillsValue = () => {
    if (formData.expenses.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    const bills = formData.expenses
      .map((expense, index) => {
        const text = ENERGY_CALCULATOR_EXPENSE_NAME_MAP[expense.expenseSourceName as EnergyCalculatorExpenseType];

        if (text === undefined) {
          return null;
        }

        return <li key={index}>{text}</li>;
      })
      .filter(Boolean);

    if (bills.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    return <ul className="confirmation-acute-need-list">{bills}</ul>;
  };

  const rows: {
    step: QuestionName;
    label: FormattedMessageType;
    value: ReactNode;
    editAriaLabelId: string;
    editAriaLabelDefault: string;
  }[] = [
    {
      step: 'energyCalculatorExpenses',
      label: <FormattedMessage id="energyCalculator.confirmation.expenses" defaultMessage="Utility Bills" />,
      value: utilityBillsValue(),
      editAriaLabelId: 'energyCalculator.confirmation.expenses.edit-AL',
      editAriaLabelDefault: 'edit expenses',
    },
    {
      step: 'energyCalculatorElectricityProvider',
      label: (
        <FormattedMessage
          id="energyCalculator.confirmation.electricityProvider"
          defaultMessage="Electric Utility Provider"
        />
      ),
      value: electricProviderName,
      editAriaLabelId: 'energyCalculator.confirmation.electricityProvider.edit-AL',
      editAriaLabelDefault: 'edit electricity provider',
    },
    {
      step: 'energyCalculatorGasProvider',
      label: <FormattedMessage id="energyCalculator.confirmation.gasProvider" defaultMessage="Gas Utility Provider" />,
      value: gasProviderName,
      editAriaLabelId: 'energyCalculator.confirmation.gasProvider.edit-AL',
      editAriaLabelDefault: 'edit gas provider',
    },
    {
      step: 'energyCalculatorUtilityStatus',
      label: (
        <FormattedMessage
          id="energyCalculator.confirmation.utilityStatus"
          defaultMessage="Disconnection Notice or Past Due Bill"
        />
      ),
      value: utilityStatusValue(),
      editAriaLabelId: 'energyCalculator.confirmation.utilityStatus.edit-AL',
      editAriaLabelDefault: 'edit utility status',
    },
    {
      step: 'energyCalculatorApplianceStatus',
      label: (
        <FormattedMessage
          id="energyCalculator.confirmation.applianceStatus"
          defaultMessage="Broken appliances or ones in need of replacement"
        />
      ),
      value: applianceStatusValue(),
      editAriaLabelId: 'energyCalculator.confirmation.applianceStatus.edit-AL',
      editAriaLabelDefault: 'edit appliance status',
    },
  ];

  return (
    <ConfirmationBlock
      icon={<Icon name="zap" aria-hidden={true} />}
      title={<FormattedMessage id="energyCalculator.confirmation.energyInfo" defaultMessage="Energy Information" />}
    >
      {rows
        .filter((row) => asks(row.step))
        .map((row) => (
          <ConfirmationItem
            key={row.step}
            label={row.label}
            value={row.value}
            editLink={
              <RowEditLink
                stepName={row.step}
                ariaLabel={formatMessage({ id: row.editAriaLabelId, defaultMessage: row.editAriaLabelDefault })}
              />
            }
          />
        ))}
    </ConfirmationBlock>
  );
}
