import { Page } from '@playwright/test';

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
  await page.getByRole('radio', { name: 'No', exact: true }).check();
}

export async function selectECIncome(page: Page, incomeType: string, frequency: string, amount: number) {
  // For energy calculator household member form, income radio is already set to 'Yes' for 16+ users
  // Just fill in the income details
  await page.getByRole('button', { name: 'Income Type' }).click();
  await page.getByRole('option', { name: incomeType }).click();
  await page.getByRole('button', { name: 'Frequency' }).click();
  await page.getByRole('option', { name: frequency }).click();
  await page.getByRole('textbox', { name: 'Amount' }).click();
  await page.getByRole('textbox', { name: 'Amount' }).fill(amount.toString());
}
