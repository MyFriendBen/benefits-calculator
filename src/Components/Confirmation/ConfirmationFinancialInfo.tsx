import { useContext, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import { ConfirmationItem, formatToUSD } from './ConfirmationBlock';
import { RowEditLink } from './ConfirmationBlock';
import { Icon } from '../Icon/Icon';
import { Context } from '../Wrapper/Wrapper';

type FormattedMessageMap = {
  [key: string]: FormattedMessageType;
};

export default function ConfirmationFinancialInfo() {
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
    <div className="confirmation-section-container">
      <div className="confirmation-section-header">
        <h2>
          <span className="confirmation-icon">
            <Icon name="receipt" aria-hidden={true} />
          </span>
          <FormattedMessage id="confirmation.financialInfo" defaultMessage="Financial Information" />
        </h2>
      </div>
      <div className="confirmation-section-content">
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
              defaultMessage="Household Resources"
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
