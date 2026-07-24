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

// A stable, PII-free ordinal for the household member a step/interaction belongs
// to. Derived from the member page (0-based: page N -> member_index N-1), NOT
// from any member attribute, so it carries no identifying data.
interface MemberIndexContext {
  member_index?: number;
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
  // `member_index` is set only on the per-member-details substep, so a
  // member-detail page view shares the ordinal with the income actions on that
  // same page; absent on all other steps.
  screener_form_step: StepContext & MemberIndexContext & { step_action: 'view' | 'complete' };
  screener_form_complete: {};
  // Emitted once per failed field (not one joined message) so no single param
  // hits GA4's 100-char string cap. `form_field_name` is the canonical field
  // path (array indices normalized, e.g. `members.birthYear`), `form_error_reason`
  // the friendly rule label, and `form_error_count` the total failed fields in
  // that submit, repeated on each event so the submit can be reconstructed.
  screener_form_error: StepContext & {
    form_field_name?: string;
    form_error_reason?: string;
    form_error_count?: number;
  };
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
  // `member_index` ties an income add/edit/delete to the member-detail page it
  // happened on (shares the ordinal with that page's screener_form_step view).
  screener_income_source: StepContext & MemberIndexContext & { action: 'add' | 'edit' | 'delete' };
  screener_has_benefits_load_error: StepContext;
  screener_language_changed: StepContext & { language_name: string };
  screener_confirmation_edit: { section: string };
  screener_confirmation_proceed: {};
  // Inline "?" tooltip click, sliced by `help_topic` (a step-identifying slug like
  // 'income-frequency') and tagged with the hosting step via StepContext. Not the
  // results-page "More Help / 211" CTA below.
  screener_help_click: StepContext & { help_topic: string };
  // Results-page "More Help / 211" CTA — kept separate from screener_help_click so
  // it doesn't pollute the inline-tooltip confusion metric.
  screener_get_help_click: { location?: string };
  // "Other Resources Near You" (more-help page) "Visit Website" link click.
  // `resource_name` is the config `label` (a plain string, PII-free);
  // `resource_index` is the item's ordinal on the page.
  screener_more_help_resource_click: { resource_name?: string; resource_index?: number; url?: string };
  // Results "Back to Screener" button — the user returning to edit their answers
  // from results. Distinct from screener_form_back (the in-form step-back button).
  screener_results_back_to_screener: {};

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
  // The set of programs shown on results, as ONE event with parallel
  // `program_ids`/`program_names` arrays rather than one event per program. GA4
  // coalesces same-name events fired in a single synchronous tick, so emitting
  // ~44 separate impressions loses most of them; a single array event doesn't.
  // `program_count` is the array length.
  screener_programs_shown: { program_ids: string[]; program_names: string[]; program_count: number };
  // The set of additional resources shown on the results tab, batched into one
  // event for the same reason as screener_programs_shown.
  screener_resources_shown: { resource_names: string[]; resource_count: number };
  // The set of navigators shown in a program's "Get Help Applying" section,
  // batched into one event; fired when a program page with navigators renders.
  screener_navigators_shown: ProgramContext & {
    navigator_ids: number[];
    navigator_names: string[];
    navigator_count: number;
  };
  // The set of downloadable documents shown in a program page's "Required Key
  // Documents Checklist", batched into one event.
  screener_program_documents_shown: ProgramContext & {
    document_names: string[];
    document_count: number;
  };
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
  // `link_location` names the emitting component. The same link_name (e.g.
  // "Privacy Policy") fires from both the footer AND inline on the Disclaimer
  // step; screener_step_name alone can't tell a footer click made while on a
  // step apart from an inline link on that step, so it's needed to distinguish
  // footer chrome from in-step links.
  screener_link_click: StepContext & {
    link_name: string;
    url?: string;
    link_location?: 'footer' | 'disclaimer_inline' | 'zip_code_inline' | 'results_needs';
  };
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
}

export type ScreenerEventName = keyof ScreenerEventMap;
