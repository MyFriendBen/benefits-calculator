import { FormattedMessage, useIntl } from 'react-intl';
import './FrequencySelector.css';
import { ExpenseFrequency } from '../../../Types/FormData';

type FrequencySelectorProps = {
  value: ExpenseFrequency;
  onChange: (value: ExpenseFrequency) => void;
  expenseName: string;
};

export default function FrequencySelector({ value, onChange, expenseName }: FrequencySelectorProps) {
  const intl = useIntl();

  const groupLabel = intl.formatMessage(
    { id: 'expenses.frequencyToggle.ariaLabel', defaultMessage: 'Expense frequency for {expenseName}' },
    { expenseName },
  );

  return (
    <div className="frequency-buttons" role="radiogroup" aria-label={groupLabel}>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'monthly'}
        className={`frequency-btn ${value === 'monthly' ? 'frequency-btn--selected' : ''}`}
        onClick={() => onChange('monthly')}
      >
        <FormattedMessage id="expenses.frequency.monthly" defaultMessage="Monthly" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'yearly'}
        className={`frequency-btn ${value === 'yearly' ? 'frequency-btn--selected' : ''}`}
        onClick={() => onChange('yearly')}
      >
        <FormattedMessage id="expenses.frequency.yearly" defaultMessage="Yearly" />
      </button>
    </div>
  );
}
