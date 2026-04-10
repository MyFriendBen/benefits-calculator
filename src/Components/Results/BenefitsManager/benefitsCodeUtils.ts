export type ColumnId = 'eligible' | 'applied' | 'receiving' | 'rejected';

export type BoardState = Record<number, ColumnId>;

const COLUMN_TO_INDEX: Record<ColumnId, number> = {
  eligible: 0,
  applied: 1,
  receiving: 2,
  rejected: 3,
};

const INDEX_TO_COLUMN: Record<number, ColumnId> = {
  0: 'eligible',
  1: 'applied',
  2: 'receiving',
  3: 'rejected',
};

/**
 * Encode board state into a compact, URL-safe string.
 * Format: base64(JSON({ programId: columnIndex }))
 */
export function encodeBoardState(state: BoardState): string {
  const compact: Record<string, number> = {};
  for (const [programId, column] of Object.entries(state)) {
    compact[programId] = COLUMN_TO_INDEX[column];
  }
  return btoa(JSON.stringify(compact));
}

/**
 * Decode a benefits code back into board state.
 * Returns null if the code is invalid.
 * Silently drops program IDs not in validProgramIds; new programs default to 'eligible'.
 */
export function decodeBoardState(code: string, validProgramIds: number[]): BoardState | null {
  try {
    const json = atob(code);
    const compact = JSON.parse(json) as Record<string, number>;

    if (typeof compact !== 'object' || compact === null || Array.isArray(compact)) {
      return null;
    }

    const state: BoardState = {};
    const validSet = new Set(validProgramIds);

    // Restore known programs from the code
    for (const [idStr, colIndex] of Object.entries(compact)) {
      const programId = Number(idStr);
      const column = INDEX_TO_COLUMN[colIndex];
      if (isNaN(programId) || column === undefined) {
        return null; // malformed entry
      }
      if (validSet.has(programId)) {
        state[programId] = column;
      }
    }

    // Any valid programs not in the code default to 'eligible'
    for (const id of validProgramIds) {
      if (!(id in state)) {
        state[id] = 'eligible';
      }
    }

    return state;
  } catch {
    return null;
  }
}

export const ALL_COLUMNS: ColumnId[] = ['eligible', 'applied', 'receiving', 'rejected'];
