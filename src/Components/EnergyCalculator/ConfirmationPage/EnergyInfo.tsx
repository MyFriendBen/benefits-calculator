import { ReactNode, useContext } from 'react';
import { FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
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
 * heading, each row carrying its own edit link.
 *
 * Rows are limited to the questions the active white label actually asks, and
 * follow the order they were asked in, so the rows stay consistent with the
 * step the block is anchored to. The CESN renter path, for example, skips the
 * appliance question and asks about utility bills first.
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

  const notApplicable = () => (
    <FormattedMessage id="energyCalculator.confirmation.notApplicable" defaultMessage="Not applicable" />
  );

  const utilityStatusValue = () => {
    const statuses = [
      {
        key: 'disconnected',
        selected: energyCalculator?.electricityIsDisconnected,
        text: (
          <FormattedMessage
            id="energyCalculator.confirmation.energyIsDisconnected"
            defaultMessage="Your electricity and/or gas is currently disconnected"
          />
        ),
      },
      {
        key: 'pastDue',
        selected: energyCalculator?.hasPastDueEnergyBills,
        text: (
          <FormattedMessage
            id="energyCalculator.confirmation.hasPastDueEnergyBills"
            defaultMessage="You have a past-due electric or heating bill or you are low on fuel"
          />
        ),
      },
      {
        key: 'oldCar',
        selected: energyCalculator?.hasOldCar,
        text: (
          <FormattedMessage
            id="energyCalculator.confirmation.hasOldCar"
            defaultMessage="You have a gas or diesel-powered vehicle that is 12+ years old or has failed an emissions test"
          />
        ),
      },
    ].filter((status) => status.selected);

    if (statuses.length === 0) {
      return notApplicable();
    }

    return (
      <ul className="confirmation-expense-list">
        {statuses.map((status) => (
          <li key={status.key}>{status.text}</li>
        ))}
      </ul>
    );
  };

  const applianceStatusValue = () => {
    const truthyApplianceStatuses = Object.entries(applianceStatusOptions).filter(([applianceKey]) => {
      return energyCalculator?.[applianceKey as keyof EnergyCalculatorFormData] === true;
    });

    if (truthyApplianceStatuses.length === 0) {
      return notApplicable();
    }

    return (
      <ul className="confirmation-expense-list">
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

    return <ul className="confirmation-expense-list">{bills}</ul>;
  };

  const rows: {
    step: QuestionName;
    label: FormattedMessageType;
    value: ReactNode;
    editAriaLabel: MessageDescriptor;
  }[] = [
    {
      step: 'energyCalculatorExpenses',
      label: <FormattedMessage id="energyCalculator.confirmation.expenses" defaultMessage="Utility Bills" />,
      value: utilityBillsValue(),
      editAriaLabel: { id: 'energyCalculator.confirmation.expenses.edit-AL', defaultMessage: 'edit expenses' },
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
      editAriaLabel: {
        id: 'energyCalculator.confirmation.electricityProvider.edit-AL',
        defaultMessage: 'edit electricity provider',
      },
    },
    {
      step: 'energyCalculatorGasProvider',
      label: <FormattedMessage id="energyCalculator.confirmation.gasProvider" defaultMessage="Gas Utility Provider" />,
      value: gasProviderName,
      editAriaLabel: { id: 'energyCalculator.confirmation.gasProvider.edit-AL', defaultMessage: 'edit gas provider' },
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
      editAriaLabel: {
        id: 'energyCalculator.confirmation.utilityStatus.edit-AL',
        defaultMessage: 'edit utility status',
      },
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
      editAriaLabel: {
        id: 'energyCalculator.confirmation.applianceStatus.edit-AL',
        defaultMessage: 'edit appliance status',
      },
    },
  ];

  return (
    <ConfirmationBlock
      icon={<Icon name="zap" aria-hidden={true} />}
      title={<FormattedMessage id="energyCalculator.confirmation.energyInfo" defaultMessage="Energy Information" />}
    >
      {rows
        .filter((row) => asks(row.step))
        .sort((a, b) => stepDirectory.indexOf(a.step) - stepDirectory.indexOf(b.step))
        .map((row) => (
          <ConfirmationItem
            key={row.step}
            label={row.label}
            value={row.value}
            editLink={<RowEditLink stepName={row.step} ariaLabel={formatMessage(row.editAriaLabel)} />}
          />
        ))}
    </ConfirmationBlock>
  );
}
