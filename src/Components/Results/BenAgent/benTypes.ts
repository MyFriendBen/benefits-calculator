import type { Program } from '../../../Types/Results';

export type BenStep = 'greeting' | 'already_have' | 'confirm_hide' | 'hide_others' | 'minimized';

export type SortLens = 'highest_value' | 'quickest_apply' | 'most_likely' | 'quickest_receive';

export interface BenHistoryItem {
  benText: string;
  userText: string;
}

export interface BenPersistedState {
  step: BenStep;
  alreadyHaveProgramIds: number[];
  notInterestedProgramIds: number[];
  selectedLens: SortLens | null;
  history: BenHistoryItem[];
}

export interface BenConversationState extends BenPersistedState {
  /** Programs temporarily toggled during the already_have step before confirming */
  pendingAlreadyHaveIds: number[];
  /** Programs temporarily toggled during the hide_others step */
  pendingNotInterestedIds: number[];
  /** Which category we're currently showing in the already_have flow */
  categoryIndex: number;
}

export type BenAction =
  | { type: 'GO_TO_STEP'; step: BenStep; benText: string; userText: string }
  | { type: 'TOGGLE_PENDING_PROGRAM'; programId: number }
  | { type: 'TOGGLE_NOT_INTERESTED'; programId: number }
  | { type: 'NEXT_CATEGORY'; totalCategories: number; benText: string; userText: string }
  | { type: 'SKIP_ALL_CATEGORIES'; benText: string; userText: string }
  | { type: 'CONFIRM_HIDE_ALREADY_HAVE'; benText: string; userText: string }
  | { type: 'CONFIRM_HIDE_OTHERS'; benText: string; userText: string }
  | { type: 'SKIP'; benText?: string; userText?: string }
  | { type: 'RESTORE' };

export interface BenContextValue {
  state: BenConversationState;
  dispatch: React.Dispatch<BenAction>;
  /** Programs not marked as "already have" or "not interested" */
  filteredPrograms: Program[];
  /** Programs sorted by the selected lens */
  sortedPrograms: Program[];
  /** The top recommended program based on selected lens */
  topRecommendation: Program | null;
  /** Total estimated annual value of filtered programs */
  totalFilteredValue: number;
}
