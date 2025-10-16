import { useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ConfirmationBlock from '../../Confirmation/ConfirmationBlock';
import { Context } from '../../Wrapper/Wrapper';
import { EnergyCalculatorExpenseType, ENERGY_CALCULATOR_EXPENSE_NAME_MAP } from '../Steps/Expenses';
import { ReactComponent as Bill } from '../../EnergyCalculator/Icons/Bill.svg';

export default function EnergyCalculatorExpenses() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();

  const editElectricityProviderAriaLabel = {
    id: 'energyCalculator.confirmation.expenses.edit-AL',
    defaultMessage: 'edit expenses',
  };
  const electricityProviderIconAlt = {
    id: 'energyCalculator.confirmation.expenses.icon-AL',
    defaultMessage: 'expenses',
  };

  const formatExpenses = () => {
    if (formData.expenses.length === 0) {
      return <FormattedMessage id="confirmation.noIncome" defaultMessage="None" />;
    }

    return (
      <ul className="confirmation-acute-need-list">
        {formData.expenses.map((expense, index) => {
          const text = ENERGY_CALCULATOR_EXPENSE_NAME_MAP[expense.expenseSourceName as EnergyCalculatorExpenseType];

          if (text === undefined) {
            return null;
          }

          return <li key={index}>{text}</li>;
        })}
      </ul>
    );
  };

  return (
    <ConfirmationBlock
      icon={<Bill className='option-card-lucide-icon' title={formatMessage(electricityProviderIconAlt)} />}
      title={<FormattedMessage id="energyCalculator.confirmation.expenses" defaultMessage="Utility Bills" />}
      editAriaLabel={editElectricityProviderAriaLabel}
      stepName="energyCalculatorExpenses"
    >
      {formatExpenses()}
    </ConfirmationBlock>
  );
}
