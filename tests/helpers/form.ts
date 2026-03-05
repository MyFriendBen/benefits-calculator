/**
 * Form - Form interaction helper functions
 *
 * This file contains helpers for interacting with form elements like
 * dropdowns, text fields, checkboxes, radio buttons, etc.
 */

import { Page } from '@playwright/test';
import { OPTION } from './selectors';

/**
 * Selects an option from a dropdown menu
 * @param page - Playwright page instance
 * @param dropdownSelector - CSS selector for the dropdown element
 * @param optionText - Text of the option to select
 * @param exact - Whether to match the option text exactly (default: false)
 */
export async function selectDropdownOption(
  page: Page,
  dropdownSelector: string,
  optionText: string,
  exact: boolean = false,
): Promise<void> {
  await page.locator(dropdownSelector).click();
  await page.getByRole('option', { name: optionText, exact }).click();
}

/**
 * Fills in a text field with specified value
 * @param page - Playwright page instance
 * @param labelText - Label text of the text field
 * @param value - Value to fill in
 */
export async function fillTextField(page: Page, labelText: string, value: string): Promise<void> {
  await page.getByRole('textbox', { name: labelText }).click();
  await page.getByRole('textbox', { name: labelText }).fill(value);
}

/**
 * Clicks a radio button with the specified label
 * @param page - Playwright page instance
 * @param labelText - Label text of the radio button
 */
export async function selectRadio(page: Page, labelText: string): Promise<void> {
  await page.getByRole('radio', { name: labelText }).check();
}

/**
 * Checks a checkbox with the specified label
 * @param page - Playwright page instance
 * @param labelText - Label text of the checkbox
 */
export async function checkCheckbox(page: Page, labelText: string): Promise<void> {
  await page.getByRole('checkbox', { name: labelText }).check();
}

/**
 * Unchecks a checkbox with the specified label
 * @param page - Playwright page instance
 * @param labelText - Label text of the checkbox
 */
export async function UncheckCheckbox(page: Page, labelText: string): Promise<void> {
  await page.getByRole('checkbox', { name: labelText }).uncheck();
}

/**
 * Selects birth month and fills birth year text field
 * @param page - Playwright page instance
 * @param month - Month to select (e.g., 'January')
 * @param year - Year to enter (e.g., '1990')
 */
export async function selectDate(page: Page, month: string, year: string): Promise<void> {
  const isCI = process.env.CI === 'true';
  const renderTimeout = isCI ? 20000 : 10000;
  const optionTimeout = isCI ? 20000 : 10000;
  const maxRetries = 3;
  const debugMode = process.env.PWDEBUG === '1' || process.env.DEBUG_TESTS === 'true';

  // Helper function to select dropdown option with retry logic
  const selectDropdownOption = async (buttonName: string, optionText: string, context: string) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (debugMode && attempt > 1) {
          console.log(`[FORM] ${context} selection attempt ${attempt}/${maxRetries}`);
        }

        const button = page.getByRole('button', { name: buttonName });
        await button.waitFor({ state: 'visible', timeout: renderTimeout });
        await button.click();

        // Wait for listbox to appear
        const listbox = page.locator('[role="listbox"]');
        await listbox.waitFor({ state: 'visible', timeout: renderTimeout });

        // Wait for options to be available
        await listbox.locator('[role="option"]').first().waitFor({ state: 'visible', timeout: renderTimeout });

        // Find and click the target option
        const option = listbox.locator('[role="option"]').filter({ hasText: optionText }).first();
        await option.waitFor({ state: 'visible', timeout: renderTimeout });

        // Small delay for DOM stability (addresses the detachment issue)
        await page.waitForTimeout(300);

        await option.click({ timeout: optionTimeout });

        // Verify selection by checking dropdown closes
        await listbox.waitFor({ state: 'hidden', timeout: 5000 });

        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(
            `Failed to select ${optionText} from ${buttonName} after ${maxRetries} attempts: ${(error as Error).message}`,
          );
        }

        // Brief pause before retry
        await page.waitForTimeout(500);
      }
    }
  };

  // Select month; fill year via text input (birth year is now a NumericFormat text field)
  await selectDropdownOption('Birth Month', month, 'Month');
  await page.getByRole('textbox', { name: 'Birth Year' }).fill(year);
}
/**
 * Selects an income category (the "Income Type" grouping dropdown)
 * @param page - Playwright page instance
 * @param incomeCategory - Category label to select (e.g. "Work & Self-Employment Income")
 */
export async function selectIncomeCategory(page: Page, incomeCategory: string): Promise<void> {
  await page.locator('#income-category-select-0').click();
  await page.getByRole(OPTION.byName(incomeCategory).role, { name: OPTION.byName(incomeCategory).name }).click();
}

/**
 * Selects an income source (the "Income Source" dropdown, enabled after category is chosen)
 * @param page - Playwright page instance
 * @param incomeType - Income source label to select (e.g. "Wages, salaries, or tips")
 */
export async function selectIncomeType(page: Page, incomeType: string): Promise<void> {
  await page.locator('#income-source-select-0').click();
  await page.getByRole(OPTION.byName(incomeType).role, { name: OPTION.byName(incomeType).name }).click();
}

/**
 * Selects a frequency
 * @param page - Playwright page instance
 * @param frequency - Frequency to select
 */
export async function selectFrequency(page: Page, frequency: string): Promise<void> {
  await page.locator('#income-frequency-select-0').click();
  await page.getByRole(OPTION.byName(frequency).role, { name: OPTION.byName(frequency).name }).click();
}
