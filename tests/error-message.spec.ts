import { test, expect } from '@playwright/test';
import {
  navigateToHomePage,
  verifyCurrentUrl,
  clickContinue,
  fillTextField,
  FORM_INPUTS,
  selectDropdownOption,
  selectRadio,
  selectIncomeType,
  selectFrequency,
  selectExpenseType,
  checkCheckbox,
  UncheckCheckbox,
  clickGetStarted,
  completeDisclaimer,
} from './helpers';

import { URL_PATTERNS, STATES } from './helpers/utils/constants';
import {
  fillDateOfBirth,
  fillHouseholdSize,
  selectInsurance,
  selectNearTermNeeds,
  selectReferralSource,
} from './helpers/steps';

const userInfo = {
  state: 'North Carolina',
  zipcode: '27215',
  county: 'Alamance County',
  householdSize: 1,
  dobMonth: 'January',
  dobYear: '1989',
  insurance: "I don't have or know if I have health insurance",
  incomeType: 'Wages, salaries, tips',
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

    expect(memberErrorMessages).toEqual([
      'Please enter a birth month.',
      'Please enter a birth year.',
      'Please select at least one health insurance option.',
    ]);

    await fillDateOfBirth(page, userInfo.dobMonth, userInfo.dobYear);

    await selectInsurance(page, userInfo.insurance);

    await selectRadio(page, FORM_INPUTS.YES_RADIO.name);

    await clickContinue(page);

    const incomeErrorMessages = await page.locator('span.error-message').allTextContents();

    expect(incomeErrorMessages).toEqual([
      'Please select an income type',
      'Please select a frequency',
      'Please enter a number greater than 0',
    ]);

    await selectIncomeType(page, userInfo.incomeType);
    await selectFrequency(page, userInfo.incomeFrequency);
    await fillTextField(page, FORM_INPUTS.AMOUNT.name, userInfo.incomeAmount);

    await clickContinue(page);

    // Verify expenses error message
    await verifyCurrentUrl(page, URL_PATTERNS.EXPENSES);

    await selectRadio(page, FORM_INPUTS.YES_RADIO.name);

    await clickContinue(page);

    const expenseErrorMessages = await page.locator('span.error-message').allTextContents();

    expect(expenseErrorMessages).toEqual(['Please select an expense type', 'Please enter a number greater than 0']);

    await selectExpenseType(page, userInfo.expenseType);
    await fillTextField(page, FORM_INPUTS.AMOUNT.name, userInfo.expenseAmount);

    await clickContinue(page);

    // Assets page
    await verifyCurrentUrl(page, URL_PATTERNS.ASSETS);
    await clickContinue(page);

    // Verify current benefits error message
    await verifyCurrentUrl(page, URL_PATTERNS.PUBLIC_BENEFITS);
    await selectRadio(page, FORM_INPUTS.YES_RADIO.name);

    await clickContinue(page);

    await expect(page.locator('span.error-message')).toHaveText(
      'If your household does not receive any of these benefits, please select the "No" option above.',
    );

    await page.locator('input[type="radio"][value="false"]').check();

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
    ]);

    await UncheckCheckbox(page, FORM_INPUTS.SIGNUP_CHECKBOX_1.name);
    await UncheckCheckbox(page, FORM_INPUTS.SIGNUP_CHECKBOX_2.name);

    await clickContinue(page);

    // Confirmation page
    await verifyCurrentUrl(page, URL_PATTERNS.CONFIRM_INFORMATION);
    await clickContinue(page);

    // Results page
    await verifyCurrentUrl(page, URL_PATTERNS.RESULTS);
    await expect(page.locator('.results-header .results-header-programs-count-text')).toContainText('Programs Found');

    const estimateMessages = await page.locator('div.results-header-label').allTextContents();
    expect(estimateMessages).toEqual(['Estimated Monthly Savings', 'Annual Tax Credit']);
  });
});
