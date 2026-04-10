import { useState, useMemo, useCallback } from 'react';
import { Program } from '../../../Types/Results';
import { BoardState, ColumnId, ALL_COLUMNS, encodeBoardState, decodeBoardState } from './benefitsCodeUtils';

export type ColumnMap = Record<ColumnId, Program[]>;

function buildInitialState(programs: Program[]): BoardState {
  const state: BoardState = {};
  for (const program of programs) {
    state[program.program_id] = 'eligible';
  }
  return state;
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

export function useBenefitsBoard(programs: Program[]) {
  const [boardState, setBoardState] = useState<BoardState>(() => buildInitialState(programs));

  const columns = useMemo(() => deriveColumns(programs, boardState), [programs, boardState]);

  const moveProgram = useCallback((programId: number, toColumn: ColumnId) => {
    setBoardState((prev) => ({ ...prev, [programId]: toColumn }));
  }, []);

  const benefitsCode = useMemo(() => encodeBoardState(boardState), [boardState]);

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

  return { columns, moveProgram, benefitsCode, restoreFromCode, allColumns: ALL_COLUMNS };
}
