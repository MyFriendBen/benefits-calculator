import { Page, expect } from '@playwright/test';
import { selectFrequency } from './form';
import { answerIncomeQuestion } from './steps';

export async function selectOwnerOrRenter(page: Page, type: string) {
  await page.getByRole('link', { name: type }).click();
}

export async function selectUtility(page: Page, utilityType: string) {
  await page.getByRole('button', { name: utilityType }).click();
}

export async function selectStatus(page: Page, statusType: string) {
  await page.getByRole('button', { name: statusType }).click();
}

export async function selectElectricProvider(page: Page, provider: string) {
  await page.locator('form div').filter({ hasText: 'Electric ProviderElectric' }).getByRole('button').click();
  await page.getByRole('option', { name: provider }).click();
}

export async function selectHeatingSource(page: Page, heatingSource: string) {
  await page.locator('form div').filter({ hasText: 'Heating SourceHeating Source' }).getByRole('button').click();
  await page.getByRole('option', { name: heatingSource }).click();
}

export async function selectHouseholdInfo(page: Page, householdInfo: string) {
  await page.getByRole('button', { name: householdInfo }).click();
}

export async function selectNoBenefit(page: Page) {
  // Post-MFB-862: the has-benefits step is tile-based and optional. Leaving
  // every tile unselected means "no benefits" — no radio to toggle.
  // Wait for the program fetch to resolve so Continue becomes enabled.
  await expect(page.locator('.hb-loading')).toBeHidden();
}

export async function selectECIncome(page: Page, _incomeCategory: string, _incomeType: string, frequency: string, amount: number) {
  // The EC household member form shares the three-question IncomeSection. Enter
  // wage income the same way as the main flow: employed = Yes reveals an
  // amount-only row (wages implied, no category/source), then fill frequency +
  // amount. Gig and other-benefits questions are required, so answer them No.
  await answerIncomeQuestion(page, /are you currently employed/i, 'Yes');
  await selectFrequency(page, frequency);
  await page.locator('#income-amount-input-0').fill(amount.toString());
  await answerIncomeQuestion(page, /freelance, gig, or occasional work/i, 'No');
  await answerIncomeQuestion(page, /government benefits, child support, alimony/i, 'No');
}
