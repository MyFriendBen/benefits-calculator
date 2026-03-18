import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { BenPersistedState } from './benTypes';

const STORAGE_PREFIX = 'ben_agent_';

function getStorageKey(uuid: string): string {
  return `${STORAGE_PREFIX}${uuid}`;
}

const DEFAULT_STATE: BenPersistedState = {
  step: 'greeting',
  alreadyHaveProgramIds: [],
  notInterestedProgramIds: [],
  selectedLens: null,
  history: [],
};

export function useBenLocalStorage() {
  const { uuid } = useParams();

  const load = useCallback((): BenPersistedState => {
    if (!uuid) return DEFAULT_STATE;

    try {
      const raw = localStorage.getItem(getStorageKey(uuid));
      if (!raw) return DEFAULT_STATE;
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_STATE;
    }
  }, [uuid]);

  const save = useCallback(
    (state: BenPersistedState) => {
      if (!uuid) return;

      try {
        localStorage.setItem(getStorageKey(uuid), JSON.stringify(state));
      } catch {
        // localStorage full or unavailable — silently fail
      }
    },
    [uuid],
  );

  return { load, save };
}
