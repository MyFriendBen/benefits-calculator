import { Page, expect } from '@playwright/test';
import { selectFrequency } from './form';

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
  await page.getByRole('textbox', { name: 'Birth Year' }).fill(year);
}

export async function selectInsurance(page: Page, insuranceType: string) {
  await page.locator('.option-cards-container').first().getByRole('button', { name: insuranceType }).click();
}

export async function selectCondition(page: Page, condition: string) {
  await page.locator('.option-cards-container').last().getByRole('button', { name: condition }).click();
}

/**
 * Answers one of the three income Yes/No questions (employed / gig / other).
 * Each question is a radiogroup labeled by its full question text; pass a
 * substring that uniquely matches the question you want.
 */
export async function answerIncomeQuestion(page: Page, questionText: string | RegExp, answer: 'Yes' | 'No') {
  const group = page.getByRole('radiogroup', { name: questionText });
  await group.getByRole('radio', { name: answer, exact: true }).click();
}

/**
 * Enters standard wage income for a member: answers "Are you currently
 * employed?" = Yes (which reveals an amount-only row — wages are implied, so
 * there's no category/source dropdown), then fills frequency + pre-tax amount.
 */
export async function selectIncome(page: Page, _incomeCategory: string, _incomeType: string, frequency: string, amount: number) {
  await answerIncomeQuestion(page, /are you currently employed/i, 'Yes');
  await selectFrequency(page, frequency);
  await page.locator('#income-amount-input-0').fill(amount.toString());
  // The gig and "other benefits" questions are also required — answer No so
  // Continue isn't blocked.
  await answerIncomeQuestion(page, /freelance, gig, or occasional work/i, 'No');
  await answerIncomeQuestion(page, /government benefits, child support, alimony/i, 'No');
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

/**
 * Toggles the first benefit tile on the has-benefits step and asserts
 * the selected state flipped on THAT tile (not just any pressed tile in the
 * grid — otherwise this could false-pass if another tile is already
 * selected). Useful for end-to-end coverage that the tile-based UI is
 * wired up (selection persists via aria-pressed).
 */
export async function selectFirstHasBenefitsTile(page: Page) {
  const firstTile = page.locator('.hb-tile-action').first();
  await firstTile.waitFor({ state: 'visible' });
  await firstTile.click();
  await expect(firstTile).toHaveAttribute('aria-pressed', 'true');
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
