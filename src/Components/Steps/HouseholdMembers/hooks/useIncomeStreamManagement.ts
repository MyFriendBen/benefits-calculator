import { useEffect, useRef } from 'react';
import { UseFieldArrayAppend, UseFieldArrayReplace, UseFormGetValues } from 'react-hook-form';
import { HouseholdData } from '../../../../Types/FormData';
import { EMPTY_INCOME_STREAM, IncomeStreamFormData } from '../utils/types';

type IncomeStreamsArray = IncomeStreamFormData[];

interface UseIncomeStreamManagementParams<T> {
  hasTruthyIncome: boolean;
  householdMemberFormData: HouseholdData | undefined;
  getValues: UseFormGetValues<T>;
  append: UseFieldArrayAppend<T, 'incomeStreams'>;
  replace: UseFieldArrayReplace<T, 'incomeStreams'>;
}

/**
 * Custom hook to manage income stream field array logic
 * Handles auto-adding/removing income streams based on hasIncome value
 */
export const useIncomeStreamManagement = <T extends { incomeStreams: IncomeStreamsArray }>({
  hasTruthyIncome,
  householdMemberFormData,
  getValues,
  append,
  replace,
}: UseIncomeStreamManagementParams<T>) => {
  const previousHasIncomeRef = useRef(hasTruthyIncome);

  useEffect(() => {
    // Clear all income streams if user indicates no income
    if (!hasTruthyIncome) {
      replace([]);
      previousHasIncomeRef.current = false;
      return;
    }

    // Only auto-add income stream if transitioning from false to true
    const isTransitioningToHasIncome = !previousHasIncomeRef.current && hasTruthyIncome;

    if (isTransitioningToHasIncome) {
      const currentIncomeStreams = getValues('incomeStreams');
      const noIncomeStreams = currentIncomeStreams.length === 0;
      const isNewMemberOrHadIncome = !householdMemberFormData?.id || householdMemberFormData.hasIncome === true;

      if (noIncomeStreams && isNewMemberOrHadIncome) {
        append(EMPTY_INCOME_STREAM as any);
      }
    }

    previousHasIncomeRef.current = hasTruthyIncome;
  }, [hasTruthyIncome, householdMemberFormData, getValues, append, replace]);
};
