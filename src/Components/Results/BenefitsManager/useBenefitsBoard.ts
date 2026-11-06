import { useState, useMemo, useCallback, useEffect } from 'react';
import { Program } from '../../../Types/Results';
import { BoardState, ColumnId, ALL_COLUMNS, encodeBoardState, decodeBoardState } from './benefitsCodeUtils';
import { buildDemoBoardState } from './demoData';

export type ColumnMap = Record<ColumnId, Program[]>;

// Browser-only persistence, per screen, so a refresh mid-demo keeps the board. Stored as
// the benefits code itself so saving and restoring share one format. localStorage can
// throw (private windows, storage disabled); the demo just starts fresh in that case.
const storageKey = (uuid: string) => `benefits-manager-demo-${uuid}`;

function loadSavedState(uuid: string, programs: Program[]): BoardState | null {
  try {
    const code = localStorage.getItem(storageKey(uuid));
    return code === null
      ? null
      : decodeBoardState(
          code,
          programs.map((p) => p.program_id),
        );
  } catch {
    return null;
  }
}

function deriveColumns(programs: Program[], boardState: BoardState): ColumnMap {
  const columns: ColumnMap = {
    eligible: [],
    applied: [],
    receiving: [],
    rejected: [],
  };

  // Walk the current programs, not the saved state: after an income or savings edit
  // re-runs eligibility, a program the household newly qualifies for has no saved column
  // yet and lands in Eligible, and one it no longer qualifies for simply drops off.
  for (const program of programs) {
    columns[boardState[program.program_id] ?? 'eligible'].push(program);
  }

  return columns;
}

export function useBenefitsBoard(programs: Program[], uuid: string, taxCreditIds: Set<number>) {
  // null means the untouched starting board. It is derived from the programs the household
  // qualifies for right now, so after an income or savings change (or a reset that restores
  // them) it follows the new results. The first card move freezes it into a saved state.
  const [savedState, setSavedState] = useState<BoardState | null>(() => loadSavedState(uuid, programs));

  const boardState = useMemo(
    () => savedState ?? buildDemoBoardState(programs, taxCreditIds),
    [savedState, programs, taxCreditIds],
  );

  const columns = useMemo(() => deriveColumns(programs, boardState), [programs, boardState]);

  const benefitsCode = useMemo(() => encodeBoardState(boardState), [boardState]);

  useEffect(() => {
    try {
      if (savedState === null) {
        localStorage.removeItem(storageKey(uuid));
      } else {
        localStorage.setItem(storageKey(uuid), encodeBoardState(savedState));
      }
    } catch {
      // best-effort
    }
  }, [uuid, savedState]);

  const moveProgram = useCallback(
    (programId: number, toColumn: ColumnId) => {
      setSavedState((prev) => ({ ...(prev ?? boardState), [programId]: toColumn }));
    },
    [boardState],
  );

  const columnOf = useCallback((programId: number): ColumnId | undefined => boardState[programId], [boardState]);

  const restoreFromCode = useCallback(
    (code: string): boolean => {
      const validIds = programs.map((p) => p.program_id);
      const restored = decodeBoardState(code, validIds);
      if (restored === null) return false;
      setSavedState(restored);
      return true;
    },
    [programs],
  );

  const resetDemo = useCallback(() => setSavedState(null), []);

  // Pin the board as it is now, so a recalculation only adds or drops programs instead of
  // re-deriving the whole starting board from the new results.
  const freezeBoard = useCallback(() => setSavedState((prev) => prev ?? boardState), [boardState]);

  return {
    columns,
    moveProgram,
    columnOf,
    benefitsCode,
    restoreFromCode,
    resetDemo,
    freezeBoard,
    allColumns: ALL_COLUMNS,
  };
}
