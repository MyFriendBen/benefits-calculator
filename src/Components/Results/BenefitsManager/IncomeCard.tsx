import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { LastUpdate, SaveStatus } from './useHouseholdFinances';

type IncomeCardProps = {
  monthlyIncome: number;
  lastUpdate: LastUpdate;
  status: SaveStatus;
  onSave: (monthly: number) => Promise<boolean>;
};

const IncomeCard = ({ monthlyIncome, lastUpdate, status, onSave }: IncomeCardProps) => {
  const { formatDate } = useIntl();
  const [draft, setDraft] = useState(monthlyIncome.toLocaleString('en-US'));

  // Follow the screen after a save (or any other change to it).
  useEffect(() => setDraft(monthlyIncome.toLocaleString('en-US')), [monthlyIncome]);

  const parsed = Number(draft.replace(/[$,\s]/g, ''));
  const valid = draft.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  const changed = valid && Math.round(parsed) !== monthlyIncome;
  const saving = status === 'saving';

  const source = lastUpdate?.incomeAt
    ? `Last updated ${formatDate(lastUpdate.incomeAt, { month: 'short', day: 'numeric' })} · by you`
    : 'From your screening';

  return (
    <section className="bm-panel" aria-labelledby="bm-income-title">
      <h2 className="bm-panel-title" id="bm-income-title">
        Your Income
      </h2>
      <p className="bm-panel-subtitle">Household income, before taxes</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (changed && !saving) {
            onSave(Math.round(parsed));
          }
        }}
      >
        <label className="bm-income-field">
          <span aria-hidden="true">$</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Household monthly income"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <span className="bm-income-period">/ month</span>
        </label>
        <button type="submit" className="bm-primary-btn" disabled={!changed || saving}>
          {saving ? 'Updating…' : 'Update income'}
        </button>
      </form>
      <p className="bm-panel-footnote">{source}</p>
    </section>
  );
};

export default IncomeCard;
