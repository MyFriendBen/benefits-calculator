import { useEffect, useReducer } from 'react';
import type { BenAction, BenConversationState, BenHistoryItem, BenPersistedState } from './benTypes';
import { useBenLocalStorage } from './useBenLocalStorage';

function addHistory(existing: BenHistoryItem[], benText?: string, userText?: string): BenHistoryItem[] {
  if (!benText || !userText) return existing;
  return [...existing, { benText, userText }];
}

function conversationReducer(state: BenConversationState, action: BenAction): BenConversationState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.step,
        categoryIndex: 0,
        history: addHistory(state.history, action.benText, action.userText),
      };

    case 'TOGGLE_PENDING_PROGRAM': {
      const id = action.programId;
      const pending = state.pendingAlreadyHaveIds.includes(id)
        ? state.pendingAlreadyHaveIds.filter((pid) => pid !== id)
        : [...state.pendingAlreadyHaveIds, id];
      return { ...state, pendingAlreadyHaveIds: pending };
    }

    case 'TOGGLE_NOT_INTERESTED': {
      const id = action.programId;
      const pending = state.pendingNotInterestedIds.includes(id)
        ? state.pendingNotInterestedIds.filter((pid) => pid !== id)
        : [...state.pendingNotInterestedIds, id];
      return { ...state, pendingNotInterestedIds: pending };
    }

    case 'NEXT_CATEGORY': {
      const merged = [...new Set([...state.alreadyHaveProgramIds, ...state.pendingAlreadyHaveIds])];
      const nextIndex = state.categoryIndex + 1;
      const newHistory = addHistory(state.history, action.benText, action.userText);
      if (nextIndex >= action.totalCategories) {
        return {
          ...state,
          alreadyHaveProgramIds: merged,
          pendingAlreadyHaveIds: merged,
          categoryIndex: 0,
          step: 'confirm_hide',
          history: newHistory,
        };
      }
      return {
        ...state,
        alreadyHaveProgramIds: merged,
        pendingAlreadyHaveIds: merged,
        categoryIndex: nextIndex,
        history: newHistory,
      };
    }

    case 'SKIP_ALL_CATEGORIES':
      return {
        ...state,
        categoryIndex: 0,
        step: 'confirm_hide',
        history: addHistory(state.history, action.benText, action.userText),
      };

    case 'CONFIRM_HIDE_ALREADY_HAVE':
      return {
        ...state,
        step: 'hide_others',
        history: addHistory(state.history, action.benText, action.userText),
      };

    case 'CONFIRM_HIDE_OTHERS':
      return {
        ...state,
        notInterestedProgramIds: [...state.pendingNotInterestedIds],
        pendingNotInterestedIds: [],
        step: 'minimized',
        history: addHistory(state.history, action.benText, action.userText),
      };

    case 'SKIP':
      return {
        ...state,
        step: 'minimized',
        history: addHistory(state.history, action.benText, action.userText),
      };

    case 'RESTORE':
      return { ...state, step: 'greeting', history: [] };

    default:
      return state;
  }
}

function initFromPersisted(persisted: BenPersistedState): BenConversationState {
  return {
    ...persisted,
    pendingAlreadyHaveIds: [...(persisted.alreadyHaveProgramIds ?? [])],
    pendingNotInterestedIds: [...(persisted.notInterestedProgramIds ?? [])],
    categoryIndex: 0,
  };
}

export function useBenConversation() {
  const { load, save } = useBenLocalStorage();
  const persisted = load();
  const [state, dispatch] = useReducer(conversationReducer, persisted, initFromPersisted);

  useEffect(() => {
    save({
      step: state.step,
      alreadyHaveProgramIds: state.alreadyHaveProgramIds,
      notInterestedProgramIds: state.notInterestedProgramIds,
      selectedLens: state.selectedLens,
      history: state.history,
    });
  }, [state.step, state.alreadyHaveProgramIds, state.notInterestedProgramIds, state.selectedLens, state.history, save]);

  return { state, dispatch };
}
