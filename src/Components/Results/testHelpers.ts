import { Program, Translation, MemberEligibility } from '../../Types/Results';
import { FormData } from '../../Types/FormData';
import { CitizenLabels } from '../../Assets/citizenshipFilterFormControlLabels';

export const createTranslation = (text: string): Translation => ({
  default_message: text,
  label: text,
});

export const createMemberEligibility = (
  id: string,
  eligible: boolean = true,
  value: number = 100,
  already_has: boolean = false
): MemberEligibility => ({
  frontend_id: id,
  eligible,
  value,
  already_has,
});

export const createProgram = (overrides: Partial<Program> = {}): Program => ({
  program_id: 1,
  name: createTranslation('Test Program'),
  name_abbreviated: 'TP',
  external_name: 'test_program',
  estimated_value: 100,
  household_value: 0,
  estimated_delivery_time: createTranslation('1-2 weeks'),
  estimated_application_time: createTranslation('30 minutes'),
  description_short: createTranslation('Short description'),
  description: createTranslation('Long description'),
  value_type: createTranslation('monthly'),
  learn_more_link: createTranslation('http://example.com'),
  apply_button_link: createTranslation('http://example.com/apply'),
  apply_button_description: createTranslation('Apply now'),
  legal_status_required: ['citizen'],
  estimated_value_override: createTranslation(''),
  eligible: true,
  members: [],
  failed_tests: [],
  passed_tests: [],
  already_has: false,
  new: false,
  low_confidence: false,
  navigators: [],
  documents: [],
  warning_messages: [],
  required_programs: [],
  excludes_programs: null,
  value_format: null,
  ...overrides,
});

export const createFormData = (overrides: Partial<FormData> = {}): FormData => ({
  isTest: false,
  frozen: false,
  agreeToTermsOfService: true,
  is13OrOlder: true,
  zipcode: '60601',
  county: 'Cook',
  startTime: new Date().toISOString(),
  hasExpenses: 'false',
  expenses: [],
  householdSize: 1,
  householdData: [],
  householdAssets: 0,
  hasBenefits: 'false',
  benefits: [],
  signUpInfo: {
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    hasUser: false,
    sendOffers: false,
    sendUpdates: false,
    commConsent: false,
  },
  acuteHHConditions: {},
  referrerCode: '',
  immutableReferrer: '',
  ...overrides,
} as FormData);

export const createFiltersChecked = (
  overrides: Partial<Record<CitizenLabels, boolean>> = {}
): Record<CitizenLabels, boolean> => ({
  citizen: true,
  non_citizen: false,
  gc_5plus: false,
  gc_5less: false,
  refugee: false,
  otherWithWorkPermission: false,
  gc_18plus_no5: false,
  gc_under18_no5: false,
  otherHealthCareUnder19: false,
  otherHealthCarePregnant: false,
  notPregnantOrUnder19ForOmniSalud: false,
  notPregnantOrUnder19ForEmergencyMedicaid: false,
  notPregnantForMassHealthLimited: false,
  notPregnantOrChildForMassHealthLimited: false,
  otherHealthCareUnder21: false,
  ...overrides,
} as Record<CitizenLabels, boolean>);

export const createProgramWithExclusions = (
  id: number,
  name: string,
  excludes: number[] = [],
  eligible: boolean = true,
  value: number = 100
): Program => createProgram({
  program_id: id,
  name: createTranslation(name),
  name_abbreviated: name.substring(0, 3).toUpperCase(),
  eligible,
  estimated_value: value,
  household_value: value,
  excludes_programs: excludes.length > 0 ? excludes : null,
});

export const createProgramWithMembers = (
  id: number,
  name: string,
  memberValues: { [key: string]: number },
  legalStatus: string[] = ['citizen']
): Program => {
  const members = Object.entries(memberValues).map(([memberId, value]) =>
    createMemberEligibility(memberId, true, value)
  );
  
  return createProgram({
    program_id: id,
    name: createTranslation(name),
    members,
    legal_status_required: legalStatus,
    household_value: 0,
  });
};