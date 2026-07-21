// Central catalogue of every analytics event the app emits.
//
// WHY THIS FILE EXISTS:
// All screener analytics events are emitted by the app (not scraped from the DOM
// in GTM). This file is the single source of truth for event names and their
// parameters. Because the payloads are typed, an event fired with a missing or
// misnamed parameter fails to compile — which is what prevents the class of bugs
// we saw when tracking was DOM-scraped (e.g. `[object HTMLElement]` values,
// truncated names, tangled params).
//
// GTM's job is now only to relay these named events to GA4. The event names and
// param keys here ARE the contract GTM/GA4 must mirror (see the analytics
// handoff doc). Keep names snake_case and `screener_`-prefixed.
//
// PRIVACY: never add a parameter that carries PII or identifying values
// (citizenship status, income, raw address, etc.). Emit `screener_uid` and join
// to screener data downstream in dbt/Metabase for any sensitive segmentation.

// Context automatically attached to every event by `useTrackEvent`. Call sites
// never pass these — the hook reads them from the router.
export interface ScreenerContext {
  /** White label / state slug from the route (e.g. "co", "il", "cesn"). */
  screener_state?: string;
  /** The screening UUID from the route; the join key for downstream analysis. */
  screener_uid?: string;
}

// Params common to interactions that happen on a known screener step.
interface StepContext {
  screener_step_name?: string;
  screener_step_number?: number;
}

// Params that identify a specific benefit program.
interface ProgramContext {
  program_name: string;
  /** Stable program id — preferred over program_name for grouping. */
  program_id?: string;
}

/**
 * The full event map: event name -> its parameter payload.
 *
 * `ScreenerContext` is merged in automatically by `useTrackEvent`, so payloads
 * here only declare the event-specific params.
 */
export interface ScreenerEventMap {
  // ---- Form funnel ----
  screener_form_start: StepContext;
  // One consolidated step event. `step_action` distinguishes landing on a step
  // ('view') from advancing past it ('complete') — that distinction is what
  // makes a real drop-off funnel possible.
  screener_form_step: StepContext & { step_action: 'view' | 'complete' };
  screener_form_complete: {};
  screener_form_error: StepContext & { form_error_message?: string; form_error_count?: number };
  // NOT YET EMITTED — needs a shared form-field wrapper first. Wiring only some
  // steps would produce a partial, misleading dataset, so it's deferred until a
  // single field component exists to instrument once. Tracked in MFB-1268.
  screener_form_field_engaged: StepContext & { form_field_name: string };
  screener_form_back: StepContext;
  // NOT YET EMITTED — reserved for backend submission/API failures (distinct
  // from `screener_form_error`, which is field validation). Wire when there's a
  // central submit handler to hook. Tracked in MFB-1268.
  screener_form_submit_failed: StepContext & { reason?: string };

  // ---- Step interactions ----
  screener_household_member: StepContext & { action: 'add' | 'edit' | 'delete' };
  screener_income_source: StepContext & { action: 'add' | 'edit' | 'delete' };
  screener_has_benefits_load_error: StepContext;
  screener_language_changed: StepContext & { language_name: string };
  screener_confirmation_edit: { section: string };
  screener_confirmation_proceed: {};
  // Inline "?" tooltip click, sliced by `help_topic` (a step-identifying slug like
  // 'income-frequency'). Not the results-page "More Help / 211" CTA below.
  screener_help_click: { help_topic: string };
  // Results-page "More Help / 211" CTA — kept separate from screener_help_click so
  // it doesn't pollute the inline-tooltip confusion metric.
  screener_get_help_click: { location?: string };

  // ---- Results: outcomes (fired once on results load) ----
  screener_results_loaded: { program_count: number; total_estimated_value?: number };
  screener_results_none_eligible: {};
  screener_results_error: { reference_id?: string };
  screener_results_error_recovery: {};

  // ---- Results: program interactions ----
  screener_apply_click: StepContext & ProgramContext & { url?: string };
  screener_program_more_info: StepContext & ProgramContext;
  screener_program_visit_website: StepContext & ProgramContext & { url?: string };
  screener_program_phone_click: StepContext & ProgramContext;
  screener_program_document_download: StepContext & ProgramContext & { document_name?: string };
  screener_results_tab_click: { tab_name: string };
  // Resource card "More Info" expand — first step of the resource funnel.
  screener_additional_resource_more_info: { resource_name?: string };
  // contact_method distinguishes the website vs phone (tel:) link; phone was
  // previously untracked.
  screener_additional_resource_click: { resource_name?: string; url?: string; contact_method?: 'website' | 'phone' };
  screener_required_program_click: ProgramContext;
  // Per-program impression (once per program shown on results) — the "shown"
  // denominator for a true more-info/apply ÷ shown conversion rate.
  screener_program_shown: ProgramContext;
  // Navigator ("Get Help Applying") click, tied to program + specific navigator.
  // Fires INSTEAD of the generic program website/phone events for navigator links
  // (no double-count) and adds the previously-untracked email link.
  screener_navigator_engaged: ProgramContext & {
    navigator_id: number;
    navigator_name: string;
    contact_method: 'website' | 'email' | 'phone';
    url?: string;
  };
  // Results-page scroll depth (results only — form steps force scrolling). Once
  // per depth threshold per tab per screening.
  screener_results_scroll_depth: { depth: 25 | 50 | 75 | 100; tab_name: string };
  // Which filter TYPE was engaged is safe to record; the selected VALUE is not
  // (e.g. citizenship status is PII — never send it). `filter_type` is the
  // category of filter touched, never the chosen option.
  screener_filter_engaged: { filter_type?: string };

  // ---- Share MFB (share the tool with others) ----
  screener_share: {
    share_location: 'results_popup' | 'footer';
    share_channel?: 'email' | 'sms' | 'whatsapp' | 'copy_link';
    share_provider?: string;
    share_action: 'open' | 'send' | 'close' | 'back';
  };
  screener_share_popup_shown: {};

  // ---- Save My Results (send the user their own results) ----
  screener_results_save: {
    save_channel?: 'email' | 'sms' | 'copy_link';
    save_action: 'open' | 'send' | 'close' | 'back';
  };

  // ---- Links (footer / header / nav) ----
  screener_link_click: StepContext & { link_name: string; url?: string };
  screener_logo_click: { location: 'header' | 'footer'; logo_name?: string };
  screener_social_click: { network: string };
  screener_feedback_click: { channel: 'survey' | 'email' };

  // ---- BenBot chatbot ----
  screener_benbot_opened: { entry: 'fab' | 'guide_me' };
  screener_benbot_closed: {};
  screener_benbot_message_sent: {};
  screener_benbot_error: {};

  // ---- NPS survey ----
  screener_nps_score_submitted: { score: number };
  screener_nps_reason_submitted: {};
  screener_nps_reason_skipped: {};

  // ---- Sign up / consent ----
  screener_signup_completed: { email_consent: boolean; sms_consent: boolean };

  // ---- Popups ----
  screener_notification_popup: { action: 'shown' | 'dismiss' | 'minimize' | 'restore' | 'cta_click' };

  // ---- Low-priority UI ----
  screener_document_summary_toggle: { expanded: boolean };
  screener_eligibility_tags_shown: ProgramContext;

  // ---- CESN Heat Pump Journey (MFB-1182) ----
  // Separate product surface (the energy-calculator heat-pump flow). These are
  // typed like everything else so GTM only relays them. The pre-existing
  // heat_pump_journey_* / *_connect_now_* / rebate_link_click events are
  // outbound_click actions (not in this map) and stay as-is.
  //
  // PRIVACY: the calculator collects a street address — NEVER send its value.
  // Record only THAT an address was entered. Household/fuel/project enums and
  // computed savings/emissions aggregates are non-identifying and safe.
  // Income/geographic segmentation (Story 4) is done downstream by joining on
  // screener_uid in dbt/Metabase, not via GA4 params.
  heat_pump_cta_click: { cta: 'calculate_impact' | 'connect_now' };
  heat_pump_calculator_field: {
    field: 'household_type' | 'address' | 'heating_fuel' | 'water_heating' | 'project_type';
  };
  heat_pump_calculator_submit: {
    household_type?: string;
    heating_fuel?: string;
    water_heating?: string;
    project_type?: string;
  };
  heat_pump_calculator_edit: {};
  heat_pump_calculator_error: { error_type: 'address_not_supported' | 'error' | 'invalid_response' };
  // Fired once when results render (post-API-resolution). Deltas are annual;
  // negative bill_delta = savings, negative emissions_delta = reduction.
  heat_pump_calculator_result: {
    annual_bill_delta_median?: number;
    annual_bill_delta_p20?: number;
    annual_bill_delta_p80?: number;
    annual_emissions_delta_median?: number;
    project_type?: string;
  };
  heat_pump_pdf_page: { page_number: number };
  heat_pump_pdf_print: {};
}

export type ScreenerEventName = keyof ScreenerEventMap;
