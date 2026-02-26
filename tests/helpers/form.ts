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
  const birthMonthButton = page.getByRole('button', { name: 'Birth Month' });
  await birthMonthButton.waitFor({ state: 'visible' });
  await birthMonthButton.click();
  const listbox = page.locator('[role="listbox"]');
  await listbox.waitFor({ state: 'visible' });
  const monthOption = listbox.locator('[role="option"]').filter({ hasText: month });
  await monthOption.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await monthOption.click();
  await page.getByRole('textbox', { name: 'Birth Year' }).fill(year);
}
/**
 * Selects an income type
 * @param page - Playwright page instance
 * @param incomeType - Income type to select
 */
export async function selectIncomeType(page: Page, incomeType: string): Promise<void> {
  await page.getByRole('button', { name: 'Income Type' }).click();
  await page.getByRole(OPTION.byName(incomeType).role, { name: OPTION.byName(incomeType).name }).click();
}

/**
 * Selects a frequency
 * @param page - Playwright page instance
 * @param frequency - Frequency to select
 */
export async function selectFrequency(page: Page, frequency: string): Promise<void> {
  await page.getByRole('button', { name: 'Frequency' }).click();
  await page.getByRole(OPTION.byName(frequency).role, { name: OPTION.byName(frequency).name }).click();
}

/**
 * Selects an expense type
 * @param page - Playwright page instance
 * @param expenseType - Expense type to select
 */
export async function selectExpenseType(page: Page, expenseType: string): Promise<void> {
  await page.getByRole('button', { name: 'Expense Type' }).click();
  await page.getByRole(OPTION.byName(expenseType).role, { name: OPTION.byName(expenseType).name }).click();
}
