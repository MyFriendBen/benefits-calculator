import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useResultsContext } from '../Results';
import { programValue } from '../FormattedValue';
import { useBenConversation } from './useBenConversation';
import type { BenContextValue, SortLens } from './benTypes';
import type { Program } from '../../../Types/Results';

const BenContext = createContext<BenContextValue | undefined>(undefined);

/** Parse a time string like "20 minutes" or "2-4 weeks" into a comparable number (in minutes). */
function parseTimeEstimate(raw: string): number {
  const lower = raw.toLowerCase();

  // Match patterns like "20 minutes", "1-2 hours", "2-4 weeks", "30 days"
  const match = lower.match(/(\d+)(?:\s*-\s*(\d+))?\s*(minute|hour|day|week|month)/);
  if (!match) return Infinity;

  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  const avg = (min + max) / 2;
  const unit = match[3];

  switch (unit) {
    case 'minute':
      return avg;
    case 'hour':
      return avg * 60;
    case 'day':
      return avg * 60 * 24;
    case 'week':
      return avg * 60 * 24 * 7;
    case 'month':
      return avg * 60 * 24 * 30;
    default:
      return Infinity;
  }
}

function eligibilityRatio(program: Program): number {
  const total = program.passed_tests.length + program.failed_tests.length;
  if (total === 0) return 0;
  return program.passed_tests.length / total;
}

function sortPrograms(programs: Program[], lens: SortLens): Program[] {
  const sorted = [...programs];

  switch (lens) {
    case 'highest_value':
      return sorted.sort((a, b) => programValue(b) - programValue(a));

    case 'quickest_apply':
      return sorted.sort(
        (a, b) =>
          parseTimeEstimate(a.estimated_application_time.default_message) -
          parseTimeEstimate(b.estimated_application_time.default_message),
      );

    case 'most_likely':
      return sorted.sort((a, b) => eligibilityRatio(b) - eligibilityRatio(a));

    case 'quickest_receive':
      return sorted.sort(
        (a, b) =>
          parseTimeEstimate(a.estimated_delivery_time.default_message) -
          parseTimeEstimate(b.estimated_delivery_time.default_message),
      );

    default:
      return sorted;
  }
}

export function BenProvider({ children }: PropsWithChildren) {
  const { programs } = useResultsContext();
  const { state, dispatch } = useBenConversation();

  const filteredPrograms = useMemo(
    () =>
      programs.filter(
        (p) =>
          !state.alreadyHaveProgramIds.includes(p.program_id) && !state.notInterestedProgramIds.includes(p.program_id),
      ),
    [programs, state.alreadyHaveProgramIds, state.notInterestedProgramIds],
  );

  const sortedPrograms = useMemo(
    () => (state.selectedLens ? sortPrograms(filteredPrograms, state.selectedLens) : filteredPrograms),
    [filteredPrograms, state.selectedLens],
  );

  const topRecommendation = sortedPrograms.length > 0 ? sortedPrograms[0] : null;

  const totalFilteredValue = useMemo(
    () => filteredPrograms.reduce((sum, p) => sum + programValue(p), 0),
    [filteredPrograms],
  );

  const value: BenContextValue = useMemo(
    () => ({
      state,
      dispatch,
      filteredPrograms,
      sortedPrograms,
      topRecommendation,
      totalFilteredValue,
    }),
    [state, dispatch, filteredPrograms, sortedPrograms, topRecommendation, totalFilteredValue],
  );

  return <BenContext.Provider value={value}>{children}</BenContext.Provider>;
}

export function useBenContext() {
  const context = useContext(BenContext);
  if (context === undefined) {
    throw new Error('Component not in BenContext');
  }
  return context;
}
