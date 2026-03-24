/**
 * Common Flow Helpers - Higher-level helpers for common flows
 *
 * This file contains helpers that encapsulate common multi-step flows
 * in the application, combining multiple lower-level actions.
 */

import { Page, expect } from '@playwright/test';
import { clickContinue, verifyCurrentUrl } from '../navigation';
import {
  selectDropdownOption,
  fillTextField,
  checkCheckbox,
  selectDate,
  selectIncomeCategory,
  selectIncomeType,
  selectFrequency,
} from '../form';
import { FORM_INPUTS, BUTTONS, DROPDOWN, BASIC_INFO_PAGE } from '../selectors';
import { URL_PATTERNS } from '../utils/constants';
import { FlowResult, PrimaryUserInfo, HouseholdMemberInfo, ExpenseInfo, BasicInfoMember } from './types';

/**
 * Completes the state selection step
 * @param page - Playwright page instance
 * @param state - State name to select
 * @returns Promise with flow result
 */
export async function completeStateSelection(page: Page, state: string): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.SELECT_STATE);
    await selectDropdownOption(page, FORM_INPUTS.STATE_SELECT, state);
    await clickContinue(page);
    return { success: true, step: 'state-selection' };
  } catch (error) {
    return {
      success: false,
      step: 'state-selection',
      error: error as Error,
    };
  }
}

/**
 * Completes the disclaimer step
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function completeDisclaimer(page: Page): Promise<FlowResult> {
  try {
    await checkCheckbox(page, FORM_INPUTS.DISCLAIMER_CHECKBOX_1.name);
    await checkCheckbox(page, FORM_INPUTS.DISCLAIMER_CHECKBOX_2.name);
    await clickContinue(page);
    return { success: true, step: 'disclaimer' };
  } catch (error) {
    return {
      success: false,
      step: 'disclaimer',
      error: error as Error,
    };
  }
}

/**
 * Completes the location information step
 * @param page - Playwright page instance
 * @param zipCode - Zip code to enter
 * @param county - County to select (optional, will be used only if county selector is present)
 * @returns Promise with flow result
 */
export async function completeLocationInfo(page: Page, zipCode: string, county: string): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.LOCATION_INFO);

    // Fill in the zip code (always required)
    const zipCodeInputLocator = page.getByRole(FORM_INPUTS.ZIP_CODE.role, { name: FORM_INPUTS.ZIP_CODE.name });
    await expect(zipCodeInputLocator).toBeVisible();
    await fillTextField(page, FORM_INPUTS.ZIP_CODE.name, zipCode);

    // Check if the county selector exists and handle it conditionally
    const countyDropdownLocator = page.locator(FORM_INPUTS.COUNTY_SELECT);
    const isCountySelectorVisible = await countyDropdownLocator.isVisible().catch(() => false); // Handle any errors gracefully

    if (isCountySelectorVisible) {
      await selectDropdownOption(page, FORM_INPUTS.COUNTY_SELECT, county);
    }
    // If county selector isn't visible, simply continue with the flow

    // Continue to the next step
    const continueButtonLocator = page.getByRole(BUTTONS.CONTINUE.role, { name: BUTTONS.CONTINUE.name });
    await expect(continueButtonLocator).toBeVisible();
    await expect(continueButtonLocator).toBeEnabled();
    await clickContinue(page);

    return { success: true, step: 'location-info' };
  } catch (error) {
    return {
      success: false,
      step: 'location-info',
      error: error as Error,
    };
  }
}

/**
 * Completes the household size step
 * @param page - Playwright page instance
 * @param householdSize - Household size to enter
 * @returns Promise with flow result
 */
export async function completeHouseholdSize(page: Page, householdSize: string): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_SIZE);
    await fillTextField(page, FORM_INPUTS.HOUSEHOLD_SIZE.name, householdSize);
    await clickContinue(page);
    return { success: true, step: 'household-size' };
  } catch (error) {
    return {
      success: false,
      step: 'household-size',
      error: error as Error,
    };
  }
}

/**
 * Completes the basic info page (step-5/0) for multi-member households.
 * Fills birth month/year for all members and relationship for non-primary members.
 * @param page - Playwright page instance
 * @param members - Array of basic info for each household member (index 0 = primary)
 * @returns Promise with flow result
 */
export async function completeBasicInfoPage(page: Page, members: BasicInfoMember[]): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_MEMBER);

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      // Select birth month via the indexed MUI Select
      const birthMonthSelect = page.locator(BASIC_INFO_PAGE.birthMonthSelect(i));
      await expect(birthMonthSelect).toBeVisible();
      await birthMonthSelect.click();
      await page.getByRole('option', { name: member.birthMonth, exact: true }).click();

      // Fill birth year via the indexed text input
      const birthYearInput = page.locator(BASIC_INFO_PAGE.birthYearInput(i));
      await expect(birthYearInput).toBeVisible();
      await birthYearInput.fill(member.birthYear);

      // Select relationship for non-primary members
      if (i > 0 && member.relationship) {
        const relationshipSelect = page.locator(BASIC_INFO_PAGE.relationshipSelect(i));
        await expect(relationshipSelect).toBeVisible();
        await relationshipSelect.click();
        await page.getByRole('option', { name: member.relationship, exact: true }).click();
      }
    }

    await clickContinue(page);
    return { success: true, step: 'basic-info-page' };
  } catch (error) {
    return {
      success: false,
      step: 'basic-info-page',
      error: error as Error,
    };
  }
}

/**
 * Completes primary user information
 * @param page - Playwright page instance
 * @param userInfo - Primary user information
 * @returns Promise with flow result
 */
export async function completePrimaryUserInfo(
  page: Page,
  userInfo: PrimaryUserInfo,
  skipBasicInfo = false,
): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_MEMBER);

    // Enter birth date — skipped when basic info was already collected on step-5/0
    if (!skipBasicInfo) {
      await selectDate(page, userInfo.birthMonth, userInfo.birthYear);
    }

    // Handle health insurance
    const healthInsuranceButtonLocator = page.getByRole('button', { name: "I don't have or know if I" });
    await expect(healthInsuranceButtonLocator).toBeVisible();
    await healthInsuranceButtonLocator.click();

    // Handle income
    if (userInfo.income) {
      const incomeCategoryDropdownLocator = page.locator(DROPDOWN.INCOME_CATEGORY);
      await expect(incomeCategoryDropdownLocator).toBeVisible();
      await selectIncomeCategory(page, userInfo.income.category);

      const incomeTypeDropdownLocator = page.locator(DROPDOWN.INCOME_TYPE);
      await expect(incomeTypeDropdownLocator).toBeVisible();
      await selectIncomeType(page, userInfo.income.type);

      const frequencyDropdownLocator = page.locator(DROPDOWN.FREQUENCY);
      await expect(frequencyDropdownLocator).toBeVisible();
      await selectFrequency(page, userInfo.income.frequency);

      const amountInputLocator = page.locator(FORM_INPUTS.AMOUNT);
      await expect(amountInputLocator).toBeVisible();
      await amountInputLocator.fill(userInfo.income.amount);
    }

    const continueButtonLocator = page.getByRole(BUTTONS.CONTINUE.role, { name: BUTTONS.CONTINUE.name });
    await expect(continueButtonLocator).toBeVisible();
    await expect(continueButtonLocator).toBeEnabled();
    await clickContinue(page);

    return { success: true, step: 'primary-user-info' };
  } catch (error) {
    return {
      success: false,
      step: 'primary-user-info',
      error: error as Error,
    };
  }
}

/**
 * Completes household member information
 * @param page - Playwright page instance
 * @param memberInfo - Household member information
 * @returns Promise with flow result
 */
export async function completeHouseholdMemberInfo(
  page: Page,
  memberInfo: HouseholdMemberInfo,
  skipBasicInfo = false,
): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_MEMBER);

    // Enter birth date and relationship — skipped when basic info was already collected on step-5/0
    if (!skipBasicInfo) {
      await selectDate(page, memberInfo.birthMonth, memberInfo.birthYear);
      await selectDropdownOption(page, FORM_INPUTS.RELATIONSHIP_SELECT, memberInfo.relationship, true);
    }

    // Handle health insurance
    await page.getByRole('button', { name: "They don't have or know if" }).click();

    // Handle income if applicable
    if (memberInfo.income) {
      await selectIncomeCategory(page, memberInfo.income.category);
      await selectIncomeType(page, memberInfo.income.type);
      await selectFrequency(page, memberInfo.income.frequency);
      await page.locator(FORM_INPUTS.AMOUNT).fill(memberInfo.income.amount);
    }

    await clickContinue(page);
    return { success: true, step: 'household-member-info' };
  } catch (error) {
    return {
      success: false,
      step: 'household-member-info',
      error: error as Error,
    };
  }
}

/**
 * Completes expenses information
 * @param page - Playwright page instance
 * @param expenseInfo - Expense information
 * @returns Promise with flow result
 */
export async function completeExpenses(page: Page, expenseInfo: ExpenseInfo): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.EXPENSES);

    if (expenseInfo.amount !== '0' && expenseInfo.amount !== '') {
      // Find the expense row with the matching expense type label and fill in the amount
      const row = page.locator('.expense-row', { has: page.locator(`label:text("${expenseInfo.type}")`) });
      const amountInput = row.locator('input[inputmode="numeric"]');
      await amountInput.fill(expenseInfo.amount);

      if (expenseInfo.frequency === 'yearly') {
        const frequencyBtn = row.getByRole('radio', { name: 'Yearly' });
        await frequencyBtn.click();
      }
    }

    await clickContinue(page);
    return { success: true, step: 'expenses' };
  } catch (error) {
    return {
      success: false,
      step: 'expenses',
      error: error as Error,
    };
  }
}

/**
 * Completes assets information
 * @param page - Playwright page instance
 * @param assetAmount - Asset amount to enter
 * @returns Promise with flow result
 */
export async function completeAssets(page: Page, assetAmount: string): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.ASSETS);
    await fillTextField(page, FORM_INPUTS.DOLLAR_AMOUNT.name, assetAmount);
    await clickContinue(page);
    return { success: true, step: 'assets' };
  } catch (error) {
    return {
      success: false,
      step: 'assets',
      error: error as Error,
    };
  }
}

/**
 * Completes public benefits step (typically just continues)
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function completePublicBenefits(page: Page): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.PUBLIC_BENEFITS);
    await clickContinue(page);
    return { success: true, step: 'public-benefits' };
  } catch (error) {
    return {
      success: false,
      step: 'public-benefits',
      error: error as Error,
    };
  }
}

/**
 * Completes needs selection
 * @param page - Playwright page instance
 * @param needs - Array of need options to select
 * @returns Promise with flow result
 */
export async function completeNeeds(page: Page, needs: string[]): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.NEEDS);

    // Select each need
    for (const need of needs) {
      await page.getByRole('button', { name: need }).click();
    }

    await clickContinue(page);
    return { success: true, step: 'needs' };
  } catch (error) {
    return {
      success: false,
      step: 'needs',
      error: error as Error,
    };
  }
}

/**
 * Completes referral source selection
 * @param page - Playwright page instance
 * @param referralSource - Referral source to select
 * @returns Promise with flow result
 */
export async function completeReferralSource(page: Page, referralSource: string): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.REFERRAL_SOURCE);
    await selectDropdownOption(page, FORM_INPUTS.REFERRAL_SOURCE_SELECT, referralSource);
    await clickContinue(page);
    return { success: true, step: 'referral-source' };
  } catch (error) {
    return {
      success: false,
      step: 'referral-source',
      error: error as Error,
    };
  }
}

/**
 * Completes additional information step (typically just continues)
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function completeAdditionalInfo(page: Page): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.ADDITIONAL_INFO);
    await clickContinue(page);
    return { success: true, step: 'additional-info' };
  } catch (error) {
    return {
      success: false,
      step: 'additional-info',
      error: error as Error,
    };
  }
}

/**
 * Confirms information and navigates to results
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function navigateToResults(page: Page): Promise<FlowResult> {
  try {
    await verifyCurrentUrl(page, URL_PATTERNS.CONFIRM_INFORMATION);
    await clickContinue(page);
    await verifyCurrentUrl(page, URL_PATTERNS.RESULTS);
    return { success: true, step: 'navigate-to-results' };
  } catch (error) {
    return {
      success: false,
      step: 'navigate-to-results',
      error: error as Error,
    };
  }
}
