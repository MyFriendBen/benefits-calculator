import { useCallback, useContext, useEffect, useState } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import useScreenApi from '../../../Assets/updateScreen';
import { Program } from '../../../Types/Results';
import { FormData } from '../../../Types/FormData';
import { useResultsContext } from '../Results';
import {
  DEFAULT_NEEDS,
  NeedId,
  NEEDS,
  SavingsAccount,
  accountsTotal,
  householdMonthlyIncome,
  newAccountId,
  withHouseholdMonthlyIncome,
} from './householdFinances';

/** When any recalculation last ran, and when income itself was last changed here. */
export type LastUpdate = { at: string; incomeAt: string | null } | null;
export type SaveStatus = 'idle' | 'saving' | 'error';

const accountsKey = (uuid: string) => `benefits-manager-demo-accounts-${uuid}`;
const needsKey = (uuid: string) => `benefits-manager-demo-needs-${uuid}`;
const lastUpdateKey = (uuid: string) => `benefits-manager-demo-updated-${uuid}`;
// The household's income and savings as first seen here, so "Reset demo" can put them back.
const originalKey = (uuid: string) => `benefits-manager-demo-original-${uuid}`;
type OriginalFinances = Pick<FormData, 'householdData' | 'householdAssets'>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : (JSON.parse(saved) as T);
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort, like the rest of the demo's browser storage
  }
}

// Accounts are browser-only; the screen holds just their total (household_assets). If the
// two disagree (e.g. assets changed in the screener), start over from the screen's figure.
function initialAccounts(uuid: string, householdAssets: number): SavingsAccount[] {
  const saved = readJson<SavingsAccount[] | null>(accountsKey(uuid), null);
  if (saved !== null && accountsTotal(saved) === householdAssets) {
    return saved;
  }
  return householdAssets > 0 ? [{ id: newAccountId(), name: 'Savings', balance: householdAssets }] : [];
}

/**
 * State for the manager's income, savings and needs panels.
 *
 * Saving income or savings writes to the household's screen and re-runs eligibility, so
 * amounts and columns change for real. The previous program list is kept as a baseline so
 * the page can say what the recalculation changed.
 */
export function useHouseholdFinances(uuid: string) {
  const { formData } = useContext(Context);
  const { programs, refetchResults } = useResultsContext();
  const { updateScreen } = useScreenApi();

  const monthlyIncome = householdMonthlyIncome(formData);
  const householdAssets = Number(formData.householdAssets) || 0;

  const [accounts, setAccounts] = useState<SavingsAccount[]>(() => initialAccounts(uuid, householdAssets));
  const [rankedNeeds, setRankedNeeds] = useState<NeedId[]>(() =>
    readJson<NeedId[]>(needsKey(uuid), DEFAULT_NEEDS).filter((need) => need in NEEDS),
  );
  const [lastUpdate, setLastUpdate] = useState<LastUpdate>(() => readJson<LastUpdate>(lastUpdateKey(uuid), null));
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [baseline, setBaseline] = useState<Program[] | null>(null);

  // Record the starting point once per screen, on the first visit to the manager.
  useEffect(() => {
    if (readJson<OriginalFinances | null>(originalKey(uuid), null) === null && formData.householdData.length > 0) {
      writeJson(originalKey(uuid), {
        householdData: formData.householdData,
        householdAssets: formData.householdAssets,
      });
    }
  }, [uuid, formData]);

  useEffect(() => writeJson(accountsKey(uuid), accounts), [uuid, accounts]);
  useEffect(() => writeJson(needsKey(uuid), rankedNeeds), [uuid, rankedNeeds]);
  useEffect(() => writeJson(lastUpdateKey(uuid), lastUpdate), [uuid, lastUpdate]);

  const recalculate = useCallback(
    async (nextFormData: FormData, what: 'income' | 'savings') => {
      setStatus('saving');
      const before = programs;
      try {
        await updateScreen(nextFormData);
        await refetchResults();
        setBaseline(before);
        const now = new Date().toISOString();
        setLastUpdate((prev) => ({ at: now, incomeAt: what === 'income' ? now : prev?.incomeAt ?? null }));
        setStatus('idle');
        return true;
      } catch (error) {
        console.error(error);
        setStatus('error');
        return false;
      }
    },
    [programs, updateScreen, refetchResults],
  );

  const saveIncome = useCallback(
    (targetMonthly: number) => recalculate(withHouseholdMonthlyIncome(formData, targetMonthly), 'income'),
    [formData, recalculate],
  );

  const saveAccounts = useCallback(
    async (nextAccounts: SavingsAccount[]) => {
      const ok = await recalculate({ ...formData, householdAssets: accountsTotal(nextAccounts) }, 'savings');
      if (ok) {
        setAccounts(nextAccounts);
      }
      return ok;
    },
    [formData, recalculate],
  );

  const resetFinances = useCallback(async () => {
    setRankedNeeds(DEFAULT_NEEDS);
    setLastUpdate(null);
    const original = readJson<OriginalFinances | null>(originalKey(uuid), null);
    if (
      original !== null &&
      JSON.stringify(original) !==
        JSON.stringify({ householdData: formData.householdData, householdAssets: formData.householdAssets })
    ) {
      await recalculate({ ...formData, ...original }, 'savings');
      setLastUpdate(null);
    }
    const assets = Number(original?.householdAssets ?? formData.householdAssets) || 0;
    setAccounts(assets > 0 ? [{ id: newAccountId(), name: 'Savings', balance: assets }] : []);
    setBaseline(null);
  }, [uuid, formData, recalculate]);

  return {
    monthlyIncome,
    accounts,
    saveAccounts,
    saveIncome,
    rankedNeeds,
    setRankedNeeds,
    lastUpdate,
    status,
    baseline,
    dismissBaseline: () => setBaseline(null),
    resetFinances,
  };
}
