import type { QuestionName } from '../../Types/Questions';

// Stable step identifiers for analytics (GA4). These slugs are decoupled from
// display order so they survive step skips and reorders. See MFB-1079.
//
// This is a lightweight, component-free counterpart to the
// `STEP_ID_BY_QUESTION_NAME` map in `QuestionComponentContainer.tsx` (which also
// carries each step's React component). Analytics call sites outside that
// container (e.g. `questionHooks.ts`, household member steps) import this
// instead, so they don't pull every step component into their module graph.
//
// `QuestionComponentContainer.tsx` derives its per-step `stepId` from THIS map
// (it imports it), so this is the single source of truth — there is no second
// map to keep in sync. Typed as a total `Record` (not `Partial`) so every
// QuestionName is guaranteed a stable slug: the `view` event (from the
// container) and the `complete` event (from `getStepAnalyticsId` in
// questionHooks) therefore always resolve the SAME `screener_step_name`, which
// is what lets the drop-off funnel join view↔complete on step name. Adding a
// new QuestionName without a slug here is now a compile error.
export const STEP_ANALYTICS_ID_BY_QUESTION_NAME: Record<QuestionName, string> = {
  zipcode: 'zip-code',
  householdSize: 'household-size',
  householdData: 'household-members',
  hasExpenses: 'expenses',
  householdAssets: 'assets',
  hasBenefits: 'current-benefits',
  acuteHHConditions: 'additional-resources',
  referralSource: 'referral-source',
  signUpInfo: 'sign-up',
  energyCalculatorElectricityProvider: 'cesn-electric-provider',
  energyCalculatorGasProvider: 'cesn-gas-provider',
  energyCalculatorExpenses: 'cesn-energy-expenses',
  energyCalculatorApplianceStatus: 'cesn-appliances',
  energyCalculatorUtilityStatus: 'cesn-utility-status',
};

export function getStepAnalyticsId(questionName: QuestionName | undefined): string | undefined {
  return questionName ? STEP_ANALYTICS_ID_BY_QUESTION_NAME[questionName] : undefined;
}

// Steps that live BEFORE the numbered question directory (so they aren't
// QuestionNames): the language and disclaimer screens, and the state-select
// page. Kept here so every analytics step slug is discoverable in one place
// for the GTM/GA4 handoff spec, rather than hardcoded across step components.
export const PRE_DIRECTORY_STEP_IDS = {
  language: 'language',
  disclaimer: 'disclaimer',
  selectState: 'select-state',
} as const;

// Steps that live AFTER the numbered question directory (so they aren't
// QuestionNames either): the confirmation page and the results page, which sit
// between the last question and the end of the flow. Kept alongside
// PRE_DIRECTORY_STEP_IDS so every analytics step slug lives in one place.
export const POST_DIRECTORY_STEP_IDS = {
  confirmInformation: 'confirm-information',
  results: 'results',
} as const;

// Sub-step slugs for the household-members flow. The member section spans two
// screens under one QuestionName ('householdData'): the roster (birth/relationship
// per member, page 0, shown only when household size > 1) and the per-member
// detail page (insurance/conditions/income, pages 1..N). They emit distinct slugs
// so the funnel can separate them; view/complete/back all resolve the SAME slug
// per screen via the household navigation hook.
export const HOUSEHOLD_SUBSTEP_IDS = {
  memberBasics: 'member-basics',
  memberDetails: 'member-details',
} as const;

// The household step routes by page: page 0 is the roster (member-basics), pages
// 1..N are per-member detail (member-details). Funnel step events (view / complete
// / back) resolve their slug through this one function so all three agree per page.
// NOTE: the screener_household_member / screener_income_source ACTION events keep
// the parent 'household-members' slug (their mart groups on it) — only the funnel
// step events use these sub-slugs.
export function getHouseholdSubstepId(pageNumber: number): string {
  return pageNumber === 0 ? HOUSEHOLD_SUBSTEP_IDS.memberBasics : HOUSEHOLD_SUBSTEP_IDS.memberDetails;
}
