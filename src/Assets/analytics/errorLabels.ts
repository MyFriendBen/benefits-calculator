// Shared, PII-safe mapping from validation rule codes to friendly labels, and
// the walker that turns an RHF error tree into one {field, reason} per failed
// field for the screener_form_error event. Centralized here so every emit path
// (the useStepForm hook and any step with its own useForm, e.g. Disclaimer)
// produces the SAME vocabulary for the same rule.
//
// PRIVACY: only field path + rule label travel — never the entered value or the
// localized message (either could carry PII).

// Zod issue codes + custom per-rule codes (set via .refine/.superRefine
// `params: { code }` and surfaced by mfbZodResolver as `errorCode`).
export const RULE_LABELS: Record<string, string> = {
  // standard zod codes
  too_small: 'Required',
  invalid_type: 'Required',
  too_big: 'Too long',
  invalid_string: 'Invalid format',
  invalid_enum_value: 'Invalid selection',
  custom: 'Failed validation',
  // custom rule codes
  required: 'Required',
  source_required: 'Add at least one income source',
  select_one: 'Must select an option',
  none_exclusive: "Can't combine None with others",
  invalid_amount: 'Invalid amount',
  hours_required: 'Enter hours worked',
  future_date: "Date can't be in the future",
  incomplete: 'Answer all questions',
  consent_required: 'Consent required',
  phone_format: 'Must be 10 digits',
  out_of_area: 'Not in service area',
  invalid_selection: 'Invalid selection',
  must_agree: 'Must be checked to continue',
};

// Map a rule code (or zod type) to its friendly label; unknown -> 'Invalid'.
export const labelForCode = (code: string | undefined): string => (code && RULE_LABELS[code]) || 'Invalid';

// One failed field: its canonical path and the friendly rule label. Emitted as
// separate params on screener_form_error so neither hits GA4's 100-char cap.
export interface FieldError {
  field: string;
  reason: string;
}

// Walk an RHF error tree into one FieldError per failed leaf. RHF mirrors the
// form shape, so field arrays (members[0].birthYear) have no `type` at the top
// level — recurse to the real leaf. A leaf carries an `errorCode` (custom rule,
// checked first so a refine's bare 'custom' type doesn't win) or a `type`
// (standard rule).
//
// PATH NORMALIZATION: numeric array-index segments are dropped, so
// `members.0.birthYear` and an array-level `members.birthYear` both canonicalize
// to `members.birthYear`. Without this the same field would report under several
// different paths (per-member index, array-level, bare leaf).
export const collectFieldErrors = (node: unknown, path = ''): FieldError[] => {
  if (!node || typeof node !== 'object') return [];
  const code = (node as { errorCode?: string }).errorCode;
  const t = (node as { type?: string }).type;
  const rule = code ?? t;
  if (typeof rule === 'string') return [{ field: path, reason: labelForCode(rule) }];
  return Object.entries(node as Record<string, unknown>)
    .filter(([key]) => key !== 'ref' && key !== 'message' && key !== 'errorCode')
    .flatMap(([key, child]) => {
      // Drop numeric index segments (e.g. the `0` in members.0.birthYear) so the
      // same field always reports the same canonical path.
      const isIndex = /^\d+$/.test(key);
      const nextPath = isIndex ? path : path ? `${path}.${key}` : key;
      return collectFieldErrors(child, nextPath);
    });
};

// The event-specific params for one screener_form_error emission (step context
// is added by the caller). Each failed field is its own event.
export interface FormErrorEventParams {
  form_field_name?: string;
  form_error_reason?: string;
  form_error_count?: number;
}

// Turn an RHF error tree into the list of screener_form_error payloads to emit:
// one per failed field (no joined message, which GA4 would truncate at 100
// chars), with form_error_count = the number of failed fields.
//
// `topLevelErrorCount` is RHF's own top-level key count — the value the caller
// uses to gate emission. When collectFieldErrors resolves no leaf but the caller
// says there are errors, emit one fallback event carrying that count so a failed
// submit still registers rather than emitting nothing.
//
// Pure so the two call sites (useStepForm and Disclaimer's own useForm) share
// identical emit logic and it's testable without a component render harness.
export const buildFormErrorEvents = (errors: unknown, topLevelErrorCount: number): FormErrorEventParams[] => {
  const fieldErrors = collectFieldErrors(errors);
  if (fieldErrors.length === 0) {
    return topLevelErrorCount > 0 ? [{ form_error_count: topLevelErrorCount }] : [];
  }
  return fieldErrors.map(({ field, reason }) => ({
    form_field_name: field,
    form_error_reason: reason,
    form_error_count: fieldErrors.length,
  }));
};
