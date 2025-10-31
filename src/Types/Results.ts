import { CitizenLabels } from '../Assets/citizenshipFilterFormControlLabels';
import { Language } from '../Assets/languageOptions';

export type Translation = {
  default_message: string;
  label: string;
};

// fix later
export type TestMessage = (string | Translation)[];

export type ProgramNavigator = {
  id: number;
  name: Translation;
  phone_number: string;
  email: Translation;
  assistance_link: Translation;
  description: Translation;
  languages: Language[];
};

export type ProgramCategoryCap = {
  programs: string[];
  household_cap: number;
  member_caps: { [key: string]: number } | null;
};

export type WarningMsg = {
  message: Translation;
  link_url: Translation;
  link_text: Translation;
  legal_statuses: CitizenLabels[];
};

export type MemberEligibility = {
  frontend_id: string;
  eligible: boolean;
  value: number;
  already_has: boolean;
};

export type Program = {
  program_id: number;
  name: Translation;
  name_abbreviated: string;
  external_name: string;
  estimated_value: number;
  household_value: number;
  estimated_delivery_time: Translation;
  estimated_application_time: Translation;
  description_short: Translation;
  description: Translation;
  value_type: Translation;
  learn_more_link: Translation;
  apply_button_link: Translation;
  apply_button_description: Translation;
  legal_status_required: string[];
  estimated_value_override: Translation;
  eligible: boolean;
  members: MemberEligibility[];
  failed_tests: TestMessage[];
  passed_tests: TestMessage[];
  already_has: boolean;
  new: boolean;
  low_confidence: boolean;
  navigators: ProgramNavigator[];
  documents: ProgramDocument[];
  warning_messages: WarningMsg[];
  required_programs: number[];
  excludes_programs?: number[] | null;
  value_format: string | null;
};

export type ProgramDocument = {
  text: Translation;
  link_url: Translation;
  link_text: Translation;
};

export type ProgramCategory = {
  external_name: string;
  icon: string;
  name: Translation;
  description: Translation;
  caps: ProgramCategoryCap[];
  tax_category: boolean;
  priority: number | null;
  programs: Program[];
};

export type UrgentNeed = {
  name: Translation;
  description: Translation;
  link: Translation;
  category_type: Translation;
  warning: Translation;
  phone_number: string;
  icon: string;
  notification_message: Translation | null;
};

export type Validation = {
  id: number;
  screen_uuid: string;
  program_name: string;
  eligible: boolean;
  value: string;
};

export type EligibilityResults = {
  programs: Program[];
  program_categories: ProgramCategory[];
  urgent_needs: UrgentNeed[];
  screen_id: number;
  default_language: string;
  missing_programs: boolean;
  validations: Validation[];
  created_date: string;
  pe_data: PolicyEngineData;
};

export interface PolicyEngineData {
  request: PolicyEngineRequest;
  response: PolicyEngineResponse;
}

export interface PolicyEngineRequest {
  household: {
    people: Record<string, PersonData>;
    tax_units: Record<string, TaxUnitData>;
    families: Record<string, FamilyData>;
    households: Record<string, HouseholdData>;
    spm_units: Record<string, SpmUnitData>;
    marital_units: Record<string, unknown>;
  };
}

export interface PolicyEngineResponse {
  status: string;
  message: string | null;
  result: {
    people: Record<string, PersonData>;
    tax_units: Record<string, TaxUnitData>;
    families: Record<string, FamilyData>;
    households: Record<string, HouseholdData>;
    spm_units: Record<string, SpmUnitData>;
    marital_units: Record<string, unknown>;
  };
}

export interface PersonData {
  ssi_countable_resources?: Record<string, number>;
  ssi_reported?: Record<string, number>;
  is_blind?: Record<string, boolean>;
  is_disabled?: Record<string, boolean>;
  ssi_earned_income?: Record<string, number>;
  ssi_unearned_income?: Record<string, number>;
  age?: Record<string, number>;
  is_tax_unit_spouse?: Record<string, boolean>;
  is_tax_unit_head?: Record<string, boolean>;
  is_tax_unit_dependent?: Record<string, boolean>;
  ssi?: Record<string, number>;
  is_pregnant?: Record<string, boolean>;
  employment_income?: Record<string, number>;
  self_employment_income?: Record<string, number>;
  rental_income?: Record<string, number>;
  taxable_pension_income?: Record<string, number>;
  social_security?: Record<string, number>;
  medicaid?: Record<string, number | null>;
  medicaid_category?: Record<string, string | null>;
  is_optional_senior_or_disabled_for_medicaid?: Record<string, boolean | null>;
  current_pregnancies?: Record<string, number>;
  wic?: Record<string, number | null>;
  wic_category?: Record<string, string | null>;
  child_support_expense?: Record<string, number>;
  real_estate_taxes?: Record<string, number>;
  medical_out_of_pocket_expenses?: Record<string, number>;
  is_snap_ineligible_student?: Record<string, boolean>;
  is_full_time_college_student?: Record<string, boolean>;
}

export interface TaxUnitData {
  members: string[];
  aca_ptc?: Record<string, number | null>;
  eitc?: Record<string, number | null>;
  ctc_value?: Record<string, number | null>;
}

export interface FamilyData {
  members: string[];
}

export interface HouseholdData {
  members: string[];
  state_code?: Record<string, string>;
  zip_code?: Record<string, string>;
  county_str?: Record<string, string>;
}

export interface SpmUnitData {
  members: string[];
  school_meal_countable_income?: Record<string, number>;
  broadband_cost?: Record<string, number>;
  lifeline?: Record<string, number | null>;
  school_meal_daily_subsidy?: Record<string, number | null>;
  school_meal_tier?: Record<string, string | null>;
  snap_unearned_income?: Record<string, number>;
  snap_earned_income?: Record<string, number>;
  snap_assets?: Record<string, number>;
  snap_emergency_allotment?: Record<string, number>;
  housing_cost?: Record<string, number>;
  has_phone_expense?: Record<string, boolean>;
  has_heating_cooling_expense?: Record<string, boolean>;
  heating_cooling_expense?: Record<string, number>;
  childcare_expenses?: Record<string, number>;
  water_expense?: Record<string, number>;
  phone_expense?: Record<string, number>;
  homeowners_association_fees?: Record<string, number>;
  homeowners_insurance?: Record<string, number>;
  snap?: Record<string, number | null>;
  nc_tanf_countable_earned_income?: Record<string, number>;
  nc_tanf_countable_gross_unearned_income?: Record<string, number>;
  nc_tanf?: Record<string, number | null>;
  nc_scca_countable_income?: Record<string, number>;
  nc_scca?: Record<string, number | null>;
}

// Lifetime benefit value types - Phase 1 implementation
export interface LifetimeProjectionExplanation {
  summary: string;
  detailed_explanation: string;
  methodology_explanation?: string;
  factors_affecting_duration: string[];
  program_specific_factors?: string[];
}

export interface LifetimeProjectionRiskAssessment {
  risk_level: 'low' | 'moderate' | 'high';
  risk_factors: string[];
  confidence_notes: string;
  accuracy_indicators?: {
    data_quality: string;
    sample_size: number;
    last_validation: string;
  };
}

export interface LifetimeProjectionDisplayConfig {
  should_display: boolean;
  section_priority: number;
  collapsible: boolean;
  default_expanded: boolean;
  show_detailed_methodology?: boolean;
  section_title?: string;
}

export interface LifetimeProjectionResearchValidation {
  primary_source: string;
  supporting_sources?: string[];
  confidence_validation: string;
}

export interface LifetimeProjection {
  program_id: string;
  prediction_id: string;
  calculation_date: string;
  estimated_duration_months: number;
  confidence_interval: {
    lower_months: number;
    upper_months: number;
    confidence_level: number;
  };
  estimated_lifetime_value: number;
  lifetime_value_range: {
    lower_value: number;
    upper_value: number;
  };
  calculation_method: string;
  multiplier_version: string;
  data_source: string;
  explanation: LifetimeProjectionExplanation;
  risk_assessment: LifetimeProjectionRiskAssessment;
  research_validation?: LifetimeProjectionResearchValidation;
  display_config: LifetimeProjectionDisplayConfig;
}

export interface LifetimeProjectionSummary {
  total_estimated_lifetime_value: number;
  total_lifetime_range: {
    lower_value: number;
    upper_value: number;
  };
  average_benefit_duration_months: number;
  total_programs_with_projections: number;
  confidence_level: 'low' | 'moderate' | 'high';
  display_text: {
    primary_summary: string;
    confidence_summary: string;
    duration_summary: string;
  };
}

export interface LifetimeProjectionData {
  available: boolean;
  language_supported: boolean;
  summary: LifetimeProjectionSummary;
  projections: LifetimeProjection[];
  calculation_metadata: {
    calculation_method: string;
    ai_explanation_model: string;
    prediction_cache_ttl_hours: number;
    last_updated: string;
  };
}

export interface LifetimeProjectionError {
  code: string;
  message: string;
  details: {
    [key: string]: any;
  };
}

// Enhanced eligibility results with lifetime projections
export interface EnhancedEligibilityResults extends EligibilityResults {
  lifetime_projections?: LifetimeProjectionData;
  lifetime_projection_error?: LifetimeProjectionError;
  // Program-specific API response format
  lifetime_projection?: {
    available: boolean;
    language_supported?: boolean;
    program_projection?: LifetimeProjection;
    error?: {
      code: string;
      message: string;
    };
    calculation_metadata?: {
      calculation_method: string;
      ai_explanation_model: string;
      prediction_cache_ttl_hours: number;
      last_updated: string;
    };
  };
}
