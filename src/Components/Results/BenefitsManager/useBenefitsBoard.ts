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
    return code === null ? null : decodeBoardState(code, programs.map((p) => p.program_id));
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

  const programMap = new Map(programs.map((p) => [p.program_id, p]));

  for (const [idStr, column] of Object.entries(boardState)) {
    const program = programMap.get(Number(idStr));
    if (program) {
      columns[column].push(program);
    }
  }

  return columns;
}

export function useBenefitsBoard(programs: Program[], uuid: string, taxCreditIds: Set<number>) {
  const [boardState, setBoardState] = useState<BoardState>(
    () => loadSavedState(uuid, programs) ?? buildDemoBoardState(programs, taxCreditIds),
  );

  const columns = useMemo(() => deriveColumns(programs, boardState), [programs, boardState]);

  const benefitsCode = useMemo(() => encodeBoardState(boardState), [boardState]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(uuid), benefitsCode);
    } catch {
      // best-effort
    }
  }, [uuid, benefitsCode]);

  const moveProgram = useCallback((programId: number, toColumn: ColumnId) => {
    setBoardState((prev) => ({ ...prev, [programId]: toColumn }));
  }, []);

  const columnOf = useCallback((programId: number): ColumnId | undefined => boardState[programId], [boardState]);

  const restoreFromCode = useCallback(
    (code: string): boolean => {
      const validIds = programs.map((p) => p.program_id);
      const restored = decodeBoardState(code, validIds);
      if (restored === null) return false;
      setBoardState(restored);
      return true;
    },
    [programs],
  );

  const resetDemo = useCallback(() => {
    setBoardState(buildDemoBoardState(programs, taxCreditIds));
  }, [programs, taxCreditIds]);

  return { columns, moveProgram, columnOf, benefitsCode, restoreFromCode, resetDemo, allColumns: ALL_COLUMNS };
}
