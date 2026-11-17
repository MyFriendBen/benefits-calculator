import { AcuteHHConditions } from '../Types/FormData';

/**
 * Each household need's answer key, as the white label config offers it, and the screen field it is
 * saved to. benefits-api's `ACUTE_OPTION_FIELDS` (screener/allowed_values.py) is the source. This
 * copy exists because a reopened screen's needs are converted before its config has loaded, and
 * `Components/Config/apiServedLists.test.ts` pins the two together.
 */
export const ACUTE_CONDITION_FIELDS = {
  food: 'needs_food',
  babySupplies: 'needs_baby_supplies',
  housing: 'needs_housing_help',
  support: 'needs_mental_health_help',
  childDevelopment: 'needs_child_dev_help',
  familyPlanning: 'needs_family_planning_help',
  jobResources: 'needs_job_resources',
  dentalCare: 'needs_dental_care',
  legalServices: 'needs_legal_services',
  savings: 'needs_college_savings',
  veteranServices: 'needs_veteran_services',
  disabilityResources: 'needs_disability_resources',
  agingResources: 'needs_aging_resources',
  homelessServices: 'needs_homeless_services',
  freeLowCostMedicalCare: 'needs_free_low_cost_medical_care',
  transportation: 'needs_transportation',
  medicalExpensesAndDebt: 'needs_medical_expenses_and_debt',
  drugAlcoholUse: 'needs_drug_alcohol_use',
} as const;

type NeedsField = (typeof ACUTE_CONDITION_FIELDS)[keyof typeof ACUTE_CONDITION_FIELDS];

/** The screen fields for the household's needs; an unanswered need is sent as null. */
export function acuteConditionsToApi(conditions: AcuteHHConditions): Record<NeedsField, boolean | null> {
  return Object.fromEntries(
    Object.entries(ACUTE_CONDITION_FIELDS).map(([key, field]) => [field, conditions[key] ?? null]),
  ) as Record<NeedsField, boolean | null>;
}

/** The household's needs from a saved screen; an unset field reads as not needed. */
export function acuteConditionsFromApi(screen: Partial<Record<NeedsField, boolean | null>>): AcuteHHConditions {
  return Object.fromEntries(
    Object.entries(ACUTE_CONDITION_FIELDS).map(([key, field]) => [key, screen[field] ?? false]),
  );
}
