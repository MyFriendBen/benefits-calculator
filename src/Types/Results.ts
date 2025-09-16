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
};
