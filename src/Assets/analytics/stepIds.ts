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

// Household-member sub-flow steps. These render inside the household-members step
// (via HouseholdMemberRouter) but are distinct analytics steps: the basic-info
// page and the per-member detail page. Their slugs match the `data-step-id` on
// each page and the name the back-navigation event already resolves to, so a
// step's view and back events agree (which lets the drop-off / back-nav rate join
// them). Previously the VIEW event mislabeled both as the parent
// 'household-members', breaking that join.
export const HOUSEHOLD_SUBSTEP_IDS = {
  householdBasics: 'household-basics',
  memberDetails: 'member-details',
} as const;
