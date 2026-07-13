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
// Keep the stepId values here in sync with `QuestionComponentContainer.tsx`.
export const STEP_ANALYTICS_ID_BY_QUESTION_NAME: Partial<Record<QuestionName, string>> = {
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
