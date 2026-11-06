import { useState } from 'react';
import { SavingsAccount, accountsTotal, newAccountId } from './householdFinances';
import { SaveStatus } from './useHouseholdFinances';

type SavingsCardProps = {
  accounts: SavingsAccount[];
  status: SaveStatus;
  onSave: (accounts: SavingsAccount[]) => Promise<boolean>;
};

const formatDollars = (amount: number) => '$' + Math.round(amount).toLocaleString('en-US');

type Draft = { id: string; name: string; balance: string; isNew: boolean };

// Names and balances only — never account numbers.
const SavingsCard = ({ accounts, status, onSave }: SavingsCardProps) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const saving = status === 'saving';

  const balance = draft === null ? NaN : Number(draft.balance.replace(/[$,\s]/g, ''));
  const draftValid = draft !== null && draft.name.trim() !== '' && Number.isFinite(balance) && balance >= 0;

  const commit = async () => {
    if (draft === null || !draftValid) return;
    const account: SavingsAccount = { id: draft.id, name: draft.name.trim(), balance: Math.round(balance) };
    const next = draft.isNew
      ? [...accounts, account]
      : accounts.map((existing) => (existing.id === draft.id ? account : existing));
    if (await onSave(next)) setDraft(null);
  };

  const remove = async (id: string) => {
    if (await onSave(accounts.filter((account) => account.id !== id))) setDraft(null);
  };

  const editor = (
    <form
      className="bm-account-editor"
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
    >
      <input
        aria-label="Account name"
        placeholder="Account name"
        value={draft?.name ?? ''}
        autoFocus
        onChange={(e) => draft && setDraft({ ...draft, name: e.target.value })}
      />
      <input
        aria-label="Balance"
        placeholder="Balance"
        inputMode="numeric"
        value={draft?.balance ?? ''}
        onChange={(e) => draft && setDraft({ ...draft, balance: e.target.value })}
      />
      <div className="bm-account-editor-actions">
        <button type="submit" className="bm-primary-btn bm-small-btn" disabled={!draftValid || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="bm-link-btn" onClick={() => setDraft(null)}>
          Cancel
        </button>
        {draft && !draft.isNew && (
          <button type="button" className="bm-link-btn bm-danger" disabled={saving} onClick={() => remove(draft.id)}>
            Remove
          </button>
        )}
      </div>
    </form>
  );

  return (
    <section className="bm-panel" aria-labelledby="bm-savings-title">
      <h2 className="bm-panel-title" id="bm-savings-title">
        Savings Accounts
      </h2>
      <p className="bm-panel-subtitle">Counted toward asset limits</p>
      <ul className="bm-accounts">
        {accounts.map((account) =>
          draft?.id === account.id ? (
            <li key={account.id}>{editor}</li>
          ) : (
            <li key={account.id}>
              <button
                type="button"
                className="bm-account"
                onClick={() =>
                  setDraft({ id: account.id, name: account.name, balance: String(account.balance), isNew: false })
                }
              >
                <span>{account.name}</span>
                <strong>{formatDollars(account.balance)}</strong>
              </button>
            </li>
          ),
        )}
        {draft?.isNew && <li>{editor}</li>}
      </ul>
      <div className="bm-accounts-total">
        <span>Total</span>
        <strong>{formatDollars(accountsTotal(accounts))}</strong>
      </div>
      {draft === null && (
        <button
          type="button"
          className="bm-link-btn"
          onClick={() => setDraft({ id: newAccountId(), name: '', balance: '', isNew: true })}
        >
          + Add account
        </button>
      )}
    </section>
  );
};

export default SavingsCard;
