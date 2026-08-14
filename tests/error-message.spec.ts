import { test, expect } from '@playwright/test';
import {
  navigateToHomePage,
  verifyCurrentUrl,
  clickContinue,
  fillTextField,
  FORM_INPUTS,
  selectDropdownOption,
  selectFrequency,
  checkCheckbox,
  UncheckCheckbox,
  clickGetStarted,
  completeDisclaimer,
} from './helpers';

import { URL_PATTERNS, STATES } from './helpers/utils/constants';
import {
  answerIncomeQuestion,
  fillDateOfBirth,
  fillHouseholdSize,
  selectFirstHasBenefitsTile,
  selectInsurance,
  selectNearTermNeeds,
  selectReferralSource,
} from './helpers/steps';
import { waitForResultsPageLoad } from './helpers/results';

const userInfo = {
  state: 'North Carolina',
  zipcode: '27215',
  county: 'Alamance County',
  householdSize: 1,
  dobMonth: 'January',
  dobYear: '1989',
  insurance: "I don't have or know if I have health insurance",
  incomeCategory: 'Work & Self-Employment Income',
  incomeType: 'Wages, salaries, or tips',
  incomeFrequency: 'every month',
  incomeAmount: '2000',
  expenseType: 'Rent',
  expenseAmount: '900',
  additionalResources: ['Food or groceries'],
  referralSource: 'Test / Prospective Partner',
};

test.describe('Error Messages Test', () => {
  test('error messages of each step', async ({ page }) => {
    await navigateToHomePage(page);
    await clickGetStarted(page);

    // Verify State error message
    await verifyCurrentUrl(page, URL_PATTERNS.SELECT_STATE);

    await clickContinue(page);

    await expect(page.locator('span.error-message')).toHaveText('Please select a state');
    await selectDropdownOption(page, FORM_INPUTS.STATE_SELECT, STATES.NORTH_CAROLINA);

    await clickContinue(page);

    // Verify disclaimer error message
    await verifyCurrentUrl(page, URL_PATTERNS.DISCLAIMER);

    await clickContinue(page);

    const disclaimerErrorMessage = page.locator('span.error-message', { hasText: 'Please check the box to continue.' });
    await expect(disclaimerErrorMessage).toHaveCount(2);

    await completeDisclaimer(page);

    // Verify zip code and county error message
    await verifyCurrentUrl(page, URL_PATTERNS.LOCATION_INFO);

    await clickContinue(page);

    await expect(page.locator('span.error-message')).toHaveText('Please enter a valid zip code for North Carolina');
    await fillTextField(page, FORM_INPUTS.ZIP_CODE.name, userInfo.zipcode);

    await expect(page.locator('span.error-message')).toHaveText('Please Select a county');
    await selectDropdownOption(page, FORM_INPUTS.COUNTY_SELECT, userInfo.county);

    await clickContinue(page);

    // Verify number of household members error message
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_SIZE);

    await clickContinue(page);

    await expect(page.locator('span.error-helper-text')).toHaveText(
      'Please enter the number of people in your household (max. 8)',
    );

    await fillHouseholdSize(page, userInfo.householdSize);

    await clickContinue(page);

    // Verify household member info error message
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_MEMBER);

    await clickContinue(page);

    const memberErrorMessages = await page.locator('span.error-message').allTextContents();

    // Birth + insurance errors, plus one "Please select an answer." for each of
    // the three required income Yes/No questions (employed / gig / other).
    expect(memberErrorMessages).toEqual([
      'Please enter a birth month.',
      'Please enter a birth year.',
      'Please select at least one health insurance option.',
      'Please select an answer.',
      'Please select an answer.',
      'Please select an answer.',
    ]);

    await fillDateOfBirth(page, userInfo.dobMonth, userInfo.dobYear);

    await selectInsurance(page, userInfo.insurance);

    // Answer employed = Yes (reveals an amount-only wage row) but leave the row
    // empty, and answer the other two questions No, then submit to surface the
    // remaining per-row income errors.
    await answerIncomeQuestion(page, /are you currently employed/i, 'Yes');
    await answerIncomeQuestion(page, /freelance, gig, or occasional work/i, 'No');
    await answerIncomeQuestion(page, /government benefits, child support, alimony/i, 'No');

    await clickContinue(page);

    const incomeErrorMessages = await page.locator('span.error-message').allTextContents();

    expect(incomeErrorMessages).toEqual([
      'Please select a frequency.',
      // Blank amount now reports the required message (distinct from the
      // "greater than 0" message, which fires only for an entered zero).
      'Please enter an income amount.',
    ]);

    await selectFrequency(page, userInfo.incomeFrequency);
    await page.locator(FORM_INPUTS.AMOUNT).fill(userInfo.incomeAmount);

    await clickContinue(page);

    // Expenses page - table layout, no required fields, just continue
    await verifyCurrentUrl(page, URL_PATTERNS.EXPENSES);

    await clickContinue(page);

    // Assets page
    await verifyCurrentUrl(page, URL_PATTERNS.ASSETS);
    await clickContinue(page);

    // Current benefits step — tile-based, optional, no validation.
    // Continue is gated on the program fetch resolving, so wait for the
    // loading state to clear. Toggle the first tile to cover the new
    // tile-selection UI end-to-end (aria-pressed reflects selection).
    await verifyCurrentUrl(page, URL_PATTERNS.PUBLIC_BENEFITS);
    await expect(page.locator('.hb-loading')).toBeHidden();
    await selectFirstHasBenefitsTile(page);
    await clickContinue(page);

    // Select near term benefits
    await verifyCurrentUrl(page, URL_PATTERNS.NEEDS);

    await selectNearTermNeeds(page, userInfo.additionalResources);

    await clickContinue(page);

    // Verify referral error message
    await verifyCurrentUrl(page, URL_PATTERNS.REFERRAL_SOURCE);

    await clickContinue(page);

    await expect(page.locator('span.error-message')).toHaveText('Please select a referral source.');

    await selectReferralSource(page, userInfo.referralSource);

    await clickContinue(page);

    // Verify sign up page error message
    await verifyCurrentUrl(page, URL_PATTERNS.ADDITIONAL_INFO);

    await checkCheckbox(page, FORM_INPUTS.SIGNUP_CHECKBOX_1.name);
    await checkCheckbox(page, FORM_INPUTS.SIGNUP_CHECKBOX_2.name);

    await clickContinue(page);

    const singUpErrorMessages = await page.locator('span.error-message').allTextContents();

    expect(singUpErrorMessages).toEqual([
      'Please enter your first name',
      'Please enter your last name',
      'Please enter an email or phone number',
      '',
    ]);

    await UncheckCheckbox(page, FORM_INPUTS.SIGNUP_CHECKBOX_1.name);
    await UncheckCheckbox(page, FORM_INPUTS.SIGNUP_CHECKBOX_2.name);

    await clickContinue(page);

    // Confirmation page
    await verifyCurrentUrl(page, URL_PATTERNS.CONFIRM_INFORMATION);
    await clickContinue(page);

    // Results page
    await verifyCurrentUrl(page, URL_PATTERNS.RESULTS);
    await waitForResultsPageLoad(page);
    await expect(page.locator('.results-header .results-header-programs-count-text')).toContainText('Programs Found');

    const estimateMessages = await page.locator('div.results-header-label').allTextContents();
    expect(estimateMessages).toEqual(['Estimated Monthly Savings', 'Annual Tax Credit']);
  });
});
