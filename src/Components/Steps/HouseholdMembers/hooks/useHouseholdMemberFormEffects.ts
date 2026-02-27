import { useEffect, useRef } from 'react';
import { UseFormSetValue, UseFormGetValues, UseFormReset } from 'react-hook-form';
import { QuestionName } from '../../../../Types/Questions';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';
import { EMPTY_INCOME_STREAM } from '../utils/constants';

interface UseHouseholdMemberFormEffectsParams {
  isEnergyCalculator: boolean;
  questionName: QuestionName;
  pageNumber: number;
  defaultValues: any;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  reset: UseFormReset<any>;
  append: (value: any) => void;
  replace: (value: any[]) => void;
  calculateCurrentAgeStatus: () => { is16OrOlder: boolean; isUnder16: boolean };
  watchHasIncome: string;
  watchBirthMonth: number;
  watchBirthYear: number;
  watchIsStudent: boolean;
  watchIsDisabled: boolean;
}

/**
 * Encapsulates all side effects for the HouseholdMemberForm.
 * Keeps the main component focused on rendering.
 */
export const useHouseholdMemberFormEffects = ({
  isEnergyCalculator,
  questionName,
  pageNumber,
  defaultValues,
  setValue,
  getValues,
  reset,
  append,
  replace,
  calculateCurrentAgeStatus,
  watchHasIncome,
  watchBirthMonth,
  watchBirthYear,
  watchIsStudent,
  watchIsDisabled,
}: UseHouseholdMemberFormEffectsParams) => {
  const hasTruthyIncome = watchHasIncome === 'true';

  // Main-only: Reset student eligibility answers when the user deselects "student"
  const prevIsStudentRef = useRef(watchIsStudent);
  useEffect(() => {
    if (isEnergyCalculator) return;
    if (prevIsStudentRef.current && !watchIsStudent) {
      setValue('studentEligibility', {
        studentFullTime: undefined,
        studentJobTrainingProgram: undefined,
        studentHasWorkStudy: undefined,
        studentWorks20PlusHrs: undefined,
      }, { shouldValidate: false });
    }
    prevIsStudentRef.current = watchIsStudent;
  }, [watchIsStudent, setValue, isEnergyCalculator]);

  // Shared: Auto-append first stream when hasIncome becomes true with no streams;
  // clear streams when hasIncome becomes false
  useEffect(() => {
    const noIncomeStreamsAreListed = getValues('incomeStreams').length === 0;
    if (hasTruthyIncome && noIncomeStreamsAreListed) {
      append(EMPTY_INCOME_STREAM);
    }
    if (!hasTruthyIncome) {
      replace([]);
    }
  }, [watchHasIncome, append, replace, getValues, hasTruthyIncome]);

  // Shared: Auto-show income block for 16+ users when birth month/year changes
  useEffect(() => {
    const { is16OrOlder } = calculateCurrentAgeStatus();
    const hasStreams = getValues('incomeStreams').length > 0;
    if (is16OrOlder && !hasStreams && getValues('hasIncome') !== 'true') {
      setValue('hasIncome', 'true', { shouldDirty: true });
    } else if (!is16OrOlder && getValues('hasIncome') !== 'false') {
      setValue('hasIncome', 'false', { shouldDirty: true });
    }
  }, [watchBirthMonth, watchBirthYear]);

  // EC-only: Reset receivesSsi when disabled is unchecked
  useEffect(() => {
    if (!isEnergyCalculator) return;
    if (getValues('conditions.disabled') === false) {
      setValue('receivesSsi', 'false');
    }
  }, [watchIsDisabled, isEnergyCalculator, getValues, setValue]);

  // Page title
  useEffect(() => {
    document.title = QUESTION_TITLES[questionName];
  }, [questionName]);

  // Reset form when navigating between pages
  const prevPageRef = useRef(pageNumber);
  useEffect(() => {
    if (prevPageRef.current !== pageNumber) {
      reset(defaultValues);
      prevPageRef.current = pageNumber;
    }
  }, [pageNumber, reset, defaultValues]);

  return { hasTruthyIncome };
};
