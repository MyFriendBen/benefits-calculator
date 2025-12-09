import { QuestionName } from '../Types/Questions';

export const QUESTION_TITLES: Record<QuestionName, string> = {
  // This is for steps that get rendered in the QCC
  zipcode: 'MyFriendBen – Zip and County',
  householdSize: 'MyFriendBen – Number of Household Members',
  householdData: 'MyFriendBen – Household Member',
  hasExpenses: 'MyFriendBen – Expenses',
  householdAssets: 'MyFriendBen – Assets',
  hasBenefits: 'MyFriendBen – Existing Benefits',
  acuteHHConditions: 'MyFriendBen – Near Term Help',
  referralSource: 'MyFriendBen – Referral',
  signUpInfo: 'MyFriendBen – Optional Sign Up',
  energyCalculatorApplianceStatus: 'MyFriendBen – Appliance Broken or Needs Replacement?',
  energyCalculatorHouseholdData: 'MyFriendBen – Household Member',
  energyCalculatorUtilityStatus: 'MyFriendBen – Utility Service Status',
  energyCalculatorElectricityProvider: 'MyFriendBen – Electricity Provider',
  energyCalculatorGasProvider: 'MyFriendBen – Gas Provider',
  energyCalculatorExpenses: 'MyFriendBen – Expenses',
};

export type OtherStepName =
  | 'language'
  | 'disclaimer'
  | 'state'
  | 'confirmation'
  | 'results'
  | 'default'
  | 'energyCalculatorLandingPage'
  | 'energyCalculatorRedirectToMFB';

export const OTHER_PAGE_TITLES: Record<OtherStepName, string> = {
  language: 'MyFriendBen – Preferred Language',
  disclaimer: 'MyFriendBen – Legal',
  state: 'MyFriendBen – State',
  confirmation: 'MyFriendBen – Confirmation',
  results: 'MyFriendBen – Results',
  default: 'MyFriendBen',
  energyCalculatorLandingPage: 'MyFriendBen – Energy Calculator',
  energyCalculatorRedirectToMFB: 'Redirect to MFB',
};
