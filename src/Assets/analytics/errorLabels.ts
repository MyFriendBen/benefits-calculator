// Shared, PII-safe mapping from validation rule codes to friendly labels, and
// the walker that turns an RHF error tree into a "field: label" list for the
// screener_form_error event's form_error_message. Centralized here so every emit
// path (the useStepForm hook and any step with its own useForm, e.g. Disclaimer)
// produces the SAME vocabulary — otherwise the dashboard, which groups on
// form_error_message, would see divergent text for the same rule.
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
export const labelForCode = (code: string | undefined): string =>
  (code && RULE_LABELS[code]) || 'Invalid';

// Walk an RHF error tree into "field: label" strings. RHF mirrors the form shape,
// so field arrays (members[0].birthYear) have no `type` at the top level — recurse
// to the real leaf. A leaf carries an `errorCode` (custom rule, checked first so a
// refine's bare 'custom' type doesn't win) or a `type` (standard rule).
export const collectFieldErrors = (node: unknown, path = ''): string[] => {
  if (!node || typeof node !== 'object') return [];
  const code = (node as { errorCode?: string }).errorCode;
  const t = (node as { type?: string }).type;
  const rule = code ?? t;
  if (typeof rule === 'string') return [`${path}: ${labelForCode(rule)}`];
  return Object.entries(node as Record<string, unknown>)
    .filter(([key]) => key !== 'ref' && key !== 'message' && key !== 'errorCode')
    .flatMap(([key, child]) => collectFieldErrors(child, path ? `${path}.${key}` : key));
};
