import { useEffect, useRef } from 'react';
import { UseFormSetValue, UseFormGetValues, UseFormReset } from 'react-hook-form';
import { QuestionName } from '../../../../Types/Questions';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';
import { EMPTY_INCOME_STREAM } from '../utils/constants';
import { MAX_AGE } from '../../../../Assets/age';

interface UseHouseholdMemberFormEffectsParams {
  isEnergyCalculator: boolean;
  questionName: QuestionName;
  pageNumber: number;
  defaultValues: any;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  reset: UseFormReset<any>;
  append: (value: any) => void;
  calculateCurrentAgeStatus: () => { is16OrOlder: boolean; isUnder16: boolean };
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
  calculateCurrentAgeStatus,
  watchBirthMonth,
  watchBirthYear,
  watchIsStudent,
  watchIsDisabled,
}: UseHouseholdMemberFormEffectsParams) => {
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

  // Shared: When the user changes their birth date and becomes 16+, auto-append one
  // empty income stream if none exist. If they become under 16, do nothing — any
  // streams they added intentionally are preserved, and empty state is fine too.
  // On mount (no birth change) we do nothing — defaultValues already seeded correctly.
  const prevBirthRef = useRef({ month: watchBirthMonth, year: watchBirthYear });
  useEffect(() => {
    const birthChanged =
      prevBirthRef.current.month !== watchBirthMonth ||
      prevBirthRef.current.year !== watchBirthYear;
    prevBirthRef.current = { month: watchBirthMonth, year: watchBirthYear };

    if (!birthChanged) return;

    const currentYear = new Date().getFullYear();
    const yearIsComplete =
      watchBirthYear !== undefined &&
      watchBirthYear !== null &&
      watchBirthYear >= currentYear - MAX_AGE + 1 &&
      watchBirthYear <= currentYear;
    if (!yearIsComplete) return;

    const { is16OrOlder } = calculateCurrentAgeStatus();
    const hasStreams = getValues('incomeStreams').length > 0;

    if (is16OrOlder && !hasStreams) {
      append(EMPTY_INCOME_STREAM);
    }
  }, [watchBirthMonth, watchBirthYear, calculateCurrentAgeStatus, getValues, append]);

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
      // Sync prevBirthRef to the new page's default values so the birth-change
      // effect doesn't mistake the reset as a user-initiated birth date change
      prevBirthRef.current = { month: defaultValues.birthMonth, year: defaultValues.birthYear };
    }
  }, [pageNumber, reset, defaultValues]);
};
