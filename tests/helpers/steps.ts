import { Page } from '@playwright/test';

export async function navigateHomePage(page: Page, specificPath?: string) {
  await page.goto('/');
  if (specificPath) {
    await page.goto(specificPath);
  }
}

export async function clickGetStartedButton(page: Page) {
  await page.getByRole('button', { name: 'Get Started' }).click();
}

export async function selectLanguage(page: Page, language: string) {
  await page.locator('.language-selector').click();
  await page.getByRole('option', { name: language }).click();
}

export async function clickContinueButton(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click();
}

export async function selectState(page: Page, state: string) {
  await page.locator('#state-source-select').click();
  await page.getByRole('option', { name: state }).click();
}

export async function acceptDisclaimer(page: Page) {
  await page.getByRole('checkbox', { name: 'By proceeding, you confirm' }).check();
  await page.getByRole('checkbox', { name: 'I confirm I am 13 years of' }).check();
}

export async function fillZipCode(page: Page, zipCode: string) {
  await page.getByRole('textbox', { name: 'Zip Code' }).click();
  await page.getByRole('textbox', { name: 'Zip Code' }).fill(zipCode);
}

export async function selectCounty(page: Page, county: string) {
  await page.locator('#county-source-select').click();
  await page.getByRole('option', { name: county }).click();
}

export async function fillHouseholdSize(page: Page, size: number) {
  await page.getByRole('textbox', { name: 'Household Size' }).click();
  await page.getByRole('textbox', { name: 'Household Size' }).fill(size.toString());
}

export async function fillDateOfBirth(page: Page, month: string, year: string) {
  await page.getByRole('button', { name: 'Birth Month' }).click();
  await page.getByRole('option', { name: month }).click();
  await page.getByRole('button', { name: 'Open' }).click();
  await page.getByRole('option', { name: year }).click();
}

export async function selectInsurance(page: Page, insuranceType: string) {
  await page.locator('.option-cards-container').first().getByRole('button', { name: insuranceType }).click();
}

export async function selectCondition(page: Page, condition: string) {
  await page.locator('.option-cards-container').last().getByRole('button', { name: condition }).click();
}

export async function selectIncome(page: Page, incomeType: string, frequency: string, amount: number) {
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByRole('button', { name: 'Income Type' }).click();
  await page.getByRole('option', { name: incomeType }).click();
  await page.getByRole('button', { name: 'Frequency' }).click();
  await page.getByRole('option', { name: frequency }).click();
  await page.getByRole('textbox', { name: 'Amount' }).click();
  await page.getByRole('textbox', { name: 'Amount' }).fill(amount.toString());
}

export async function selectExpense(page: Page, expenseType: string, amount: number) {
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByRole('button', { name: 'Expense Type' }).click();
  await page.getByRole('option', { name: expenseType }).click();
  await page.getByRole('textbox', { name: 'Amount' }).click();
  await page.getByRole('textbox', { name: 'Amount' }).fill(amount.toString());
}

export async function fillHouseholdSavings(page: Page, amount: number) {
  await page.getByRole('textbox', { name: 'Dollar Amount' }).click();
  await page.getByRole('textbox', { name: 'Dollar Amount' }).fill(amount.toString());
}

export async function selectCurrentBenefits(page: Page, answer: string, benefitsType?: string, benefitName?: string) {
  await page.getByRole('radio', { name: answer }).check();
  if (answer === 'Yes') {
    // TODO
  }
}

export async function selectNearTermNeeds(page: Page, needs: string[]) {
  for (const need of needs) {
    await page.getByRole('button', { name: need }).click();
  }
}

export async function selectReferralSource(page: Page, source: string) {
  await page.locator('#referral-source-select').click();
  await page.getByRole('option', { name: source }).click();
}
