import { useEffect, useRef } from 'react';
import { UseFormSetValue, UseFormGetValues, UseFormReset } from 'react-hook-form';
import { QuestionName } from '../../../../Types/Questions';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';

interface UseHouseholdMemberFormEffectsParams {
  isEnergyCalculator: boolean;
  questionName: QuestionName;
  pageNumber: number;
  defaultValues: any;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  reset: UseFormReset<any>;
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

  // Note: the income section is gated behind three Yes/No questions,
  // so we no longer auto-append a blank income stream when a member becomes 16+.
  // The questions themselves prompt the user to enter income; an auto-seeded
  // empty-category stream would be orphaned (belongs to no question bucket).

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
};
