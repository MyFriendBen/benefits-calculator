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
 * - Clears income streams when hasIncome is false
 * - Auto-adds empty income stream when transitioning from false to true
 */
export const useIncomeStreamManagement = <T extends { incomeStreams: IncomeStreamsArray }>({
  hasTruthyIncome,
  householdMemberFormData,
  getValues,
  append,
  replace,
}: UseIncomeStreamManagementParams<T>) => {
  const previousHasIncomeRef = useRef(false);

  useEffect(() => {
    // Clear all income streams when user indicates no income
    if (!hasTruthyIncome) {
      replace([]);
      previousHasIncomeRef.current = false;
      return;
    }

    // Auto-add empty income stream when transitioning from "no income" to "has income"
    if (!previousHasIncomeRef.current && hasTruthyIncome) {
      const currentIncomeStreams = getValues('incomeStreams') as IncomeStreamsArray;

      if (currentIncomeStreams.length === 0) {
        append(EMPTY_INCOME_STREAM as any);
      }
    }

    previousHasIncomeRef.current = hasTruthyIncome;
  }, [hasTruthyIncome, householdMemberFormData, getValues, append, replace]);
};
