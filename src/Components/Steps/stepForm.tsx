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
      // "field: label" pairs for which validations failed (e.g.
      // "zipcode: Required, members.0.birthYear: Invalid format"). PRIVACY: field
      // path + friendly rule label only — never the entered value or localized
      // message (either could carry PII). Zod issue codes map to labels below.
      // Zod issue codes + custom per-rule codes (set on .refine/.superRefine and
      // surfaced by mfbZodResolver as `errorCode`) -> friendly, PII-safe labels.
      const RULE_LABELS: Record<string, string> = {
        // standard zod codes
        too_small: 'Required',
        invalid_type: 'Required',
        too_big: 'Too long',
        invalid_string: 'Invalid format',
        invalid_enum_value: 'Invalid selection',
        custom: 'Failed validation',
        // custom rule codes
        required: 'Required',
        select_one: 'Must select an option',
        none_exclusive: "Can't combine None with others",
        invalid_amount: 'Invalid amount',
        hours_required: 'Enter hours worked',
        future_date: 'Date can\'t be in the future',
        incomplete: 'Answer all questions',
        consent_required: 'Consent required',
        phone_format: 'Must be 10 digits',
        out_of_area: 'Not in service area',
        invalid_selection: 'Invalid selection',
        must_agree: 'Must be checked to continue',
      };
      // Walk into nested/array errors (RHF mirrors the form shape, so household
      // field arrays like members[0].birthYear have no `type` at the top level)
      // to report the real leaf field + rule. A leaf is any node carrying an
      // `errorCode` (custom rule) or `type` (standard) — checking errorCode first
      // catches refine errors that resolve to a bare 'custom' type otherwise.
      const collectErrors = (node: unknown, path: string): string[] => {
        if (!node || typeof node !== 'object') return [];
        const code = (node as { errorCode?: string }).errorCode;
        const t = (node as { type?: string }).type;
        const rule = code ?? t;
        if (typeof rule === 'string') return [`${path}: ${RULE_LABELS[rule] ?? 'Invalid'}`];
        return Object.entries(node as Record<string, unknown>)
          .filter(([key]) => key !== 'ref' && key !== 'message' && key !== 'errorCode')
          .flatMap(([key, child]) => collectErrors(child, path ? `${path}.${key}` : key));
      };
      const errorFields = collectErrors(errors, '').join(', ');
      track('screener_form_error', {
        screener_step_name: getStepAnalyticsId(questionName),
        screener_step_number: stepNumber >= 0 ? stepNumber : undefined,
        form_error_count: errorCount,
        form_error_message: errorFields,
      });
    }
    // Intentionally depend only on submitCount so this fires once per submit
    // attempt, not on every keystroke-driven errorCount change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return form as UseFormReturn<T>;
}
