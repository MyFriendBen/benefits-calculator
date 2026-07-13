import { useContext, useEffect } from 'react';
import { FieldValues, useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { Context } from '../Wrapper/Wrapper';
import { QuestionName } from '../../Types/Questions';
import { useGoToNextStep } from '../QuestionComponents/questionHooks';
import { useStepNumber } from '../../Assets/stepDirectory';
import { useTrackEvent } from '../../Assets/analytics';
import { getStepAnalyticsId } from '../../Assets/analytics/stepIds';

/**
 * This hook is used to create a form for screener steps.
 * By default, it will navigate to the next step when the form is submitted successfully.
 * The onSubmitSuccessfulOverride callback should be used when custom logic is needed.
 *
 * If you must navigate within the submit handler, use the setStepLoading function
 * to set the loading state to false before navigating. Otherwise, the isSubmitSuccessful
 * state will not be updated correctly and the loading state will not be set to false.
 */
export default function useStepForm<T extends FieldValues>({
  questionName,
  onSubmitSuccessfulOverride,
  ...useFormProps
}: UseFormProps<T> & {
  questionName: QuestionName;
  onSubmitSuccessfulOverride?: () => void;
}) {
  const { setStepLoading } = useContext(Context);
  const nextPage = useGoToNextStep(questionName);
  const stepNumber = useStepNumber(questionName, false);
  const track = useTrackEvent();

  const form = useForm<T>({
    ...useFormProps,
  });

  const { isSubmitting, isSubmitSuccessful, isSubmitted, submitCount, errors } = form.formState;
  const errorCount = Object.keys(errors).length;

  useEffect(() => {
    setStepLoading(isSubmitting);
  }, [isSubmitting]);

  useEffect(() => {
    if (isSubmitSuccessful) {
      if (onSubmitSuccessfulOverride) {
        onSubmitSuccessfulOverride();
      } else {
        nextPage();
      }
    }
  }, [isSubmitSuccessful, nextPage, onSubmitSuccessfulOverride]);

  // Every screener step's form goes through this hook, making it the single
  // shared place to catch validation errors for the drop-off funnel.
  //
  // Keyed on `submitCount` (incremented once per submit *attempt*), NOT on
  // `errorCount`: react-hook-form re-validates on every keystroke after the
  // first failed submit (reValidateMode: 'onChange'), so gating on errorCount
  // would refire this on each keystroke and also drop consecutive failures that
  // happen to have the same count. `submitCount` changes exactly once per
  // attempt, so we emit exactly one error event per failed submit.
  useEffect(() => {
    if (submitCount > 0 && isSubmitted && !isSubmitSuccessful && errorCount > 0) {
      track('screener_form_error', {
        screener_step_name: getStepAnalyticsId(questionName),
        screener_step_number: stepNumber >= 0 ? stepNumber : undefined,
        form_error_count: errorCount,
      });
    }
    // Intentionally depend only on submitCount so this fires once per submit
    // attempt, not on every keystroke-driven errorCount change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return form as UseFormReturn<T>;
}
