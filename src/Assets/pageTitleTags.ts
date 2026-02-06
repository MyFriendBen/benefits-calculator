import { QuestionName } from '../Types/Questions';

export const QUESTION_TITLES: Record<QuestionName, string> = {
  // This is for steps that get rendered in the QCC
  zipcode: 'Zip and County',
  householdSize: 'Number of Household Members',
  householdData: 'Household Member',
  hasExpenses: 'Expenses',
  householdAssets: 'Assets',
  hasBenefits: 'Existing Benefits',
  acuteHHConditions: 'Near Term Help',
  referralSource: 'Referral',
  signUpInfo: 'Optional Sign Up',
  energyCalculatorApplianceStatus: 'Appliance Broken or Needs Replacement?',
  energyCalculatorHouseholdData: 'Household Member',
  energyCalculatorUtilityStatus: 'Utility Service Status',
  energyCalculatorElectricityProvider: 'Electricity Provider',
  energyCalculatorGasProvider: 'Gas Provider',
  energyCalculatorExpenses: 'Expenses',
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
  language: 'Preferred Language',
  disclaimer: 'Legal',
  state: 'State',
  confirmation: 'Confirmation',
  results: 'Results',
  default: 'MyFriendBen',
  energyCalculatorLandingPage: 'Energy Calculator',
  energyCalculatorRedirectToMFB: 'Redirect to MFB',
};
