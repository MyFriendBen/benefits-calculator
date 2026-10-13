import { test, expect } from '@playwright/test';
import {
  clickGetStarted,
  clickContinue,
  verifyCurrentUrl,
  fillTextField,
  selectDropdownOption,
  selectIncomeCategory,
  selectIncomeType,
  selectFrequency,
  completeDisclaimer,
  FORM_INPUTS,
} from './helpers';
import { URL_PATTERNS, STATES } from './helpers/utils/constants';
import { answerIncomeQuestion, fillDateOfBirth, fillHouseholdSize, selectInsurance } from './helpers/steps';
import { getEvents, lastEvent } from './helpers/analytics';

// Asserts the FE pushes the right analytics events/params to the dataLayer (the
// layer GTM relays to GA4). Covers the MFB-1419 changes; view_item_list reaching
// GA4/BigQuery additionally depends on the GTM ecommerce tag config.

const nc = {
  state: 'North Carolina',
  zipcode: '27215',
  county: 'Alamance County',
  dobMonth: 'January',
  dobYear: '1989',
  insurance: "I don't have or know if I have health insurance",
  incomeCategory: 'Work & Self-Employment Income',
  incomeType: 'Wages, salaries, or tips',
  incomeFrequency: 'every month',
};

// These assert on window.dataLayer, which only exists when GTM initializes —
// i.e. when REACT_APP_GOOGLE_ANALYTICS_ID is set (local dev / prod). Envs without
// it (e.g. staging) have no dataLayer, so skip rather than fail there. Run with:
//   BASE_URL=http://localhost:3000 npm run test:e2e -- analytics-events
test.describe('Analytics events (dataLayer)', () => {
  test.beforeEach(async ({ page }) => {
    // Go straight to step-1 (the language step): '/' redirects and fires no form
    // events, whereas step-1 fires screener_form_step and hosts the Get Started CTA.
    await page.goto('/step-1');
    const hasDataLayer = await page.evaluate(() => 'dataLayer' in window);
    test.skip(!hasDataLayer, 'No dataLayer in this env (GTM not initialized — REACT_APP_GOOGLE_ANALYTICS_ID unset)');
  });

  test('form_start fires on first interaction, not page load; once per mount', async ({ page }) => {
    // beforeEach already navigated to the home page.
    // On load, the step-1 view fires but form_start does NOT (it's interaction-gated).
    expect(await getEvents(page, 'screener_form_start')).toHaveLength(0);
    expect((await getEvents(page, 'screener_form_step')).length).toBeGreaterThan(0);

    // First interaction (advancing past step 1) marks the start, exactly once.
    await clickGetStarted(page);
    expect((await getEvents(page, 'screener_form_start')).length).toBe(1);
  });

  test('county missing → form_error with field=county, reason=Required', async ({ page }) => {
    await clickGetStarted(page);
    await verifyCurrentUrl(page, URL_PATTERNS.SELECT_STATE);
    await selectDropdownOption(page, FORM_INPUTS.STATE_SELECT, STATES.NORTH_CAROLINA);
    await clickContinue(page);
    await completeDisclaimer(page);
    await verifyCurrentUrl(page, URL_PATTERNS.LOCATION_INFO);

    await fillTextField(page, FORM_INPUTS.ZIP_CODE.name, nc.zipcode);
    // Continue without picking a county.
    await clickContinue(page);

    const err = await lastEvent(page, 'screener_form_error');
    expect(err?.form_field_name).toBe('county');
    expect(err?.form_error_reason).toBe('Required');
    expect(err?.screener_state).toBe('nc');
    expect(err?.screener_uid).toBeTruthy();
  });

  // The amount field is a numeric-masked input (react-number-format), so a user
  // can only reach blank or a number — 'abc' is stripped to empty. The malformed
  // (invalid_format) case is unreachable via the UI and covered in the unit test.
  test('income amount: blank → Required, zero → Must be greater than 0', async ({ page }) => {
    await clickGetStarted(page);
    await selectDropdownOption(page, FORM_INPUTS.STATE_SELECT, STATES.NORTH_CAROLINA);
    await clickContinue(page);
    await completeDisclaimer(page);
    await fillTextField(page, FORM_INPUTS.ZIP_CODE.name, nc.zipcode);
    await selectDropdownOption(page, FORM_INPUTS.COUNTY_SELECT, nc.county);
    await clickContinue(page);
    await fillHouseholdSize(page, 1);
    await clickContinue(page);
    await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_MEMBER);
    await fillDateOfBirth(page, nc.dobMonth, nc.dobYear);
    await selectInsurance(page, nc.insurance);
    // Route through the "other recurring payments" question — it's the one that
    // reveals a full row (category + source + frequency + amount), so the amount
    // validations below fire. All three questions are required, so answer the
    // employed/gig ones No; a blocked submit still emits a form_error per field.
    await answerIncomeQuestion(page, /are you currently employed/i, 'No');
    await answerIncomeQuestion(page, /freelance, gig, or occasional work/i, 'No');
    await answerIncomeQuestion(page, /government benefits, child support, alimony/i, 'Yes');
    // Q3 excludes the employment category, so use a real non-employment
    // category/source (nc.incomeCategory is the employment one, for the wage path).
    await selectIncomeCategory(page, 'Government Benefits');
    await selectIncomeType(page, 'Supplemental Security Income (SSI)');
    await selectFrequency(page, nc.incomeFrequency);

    // blank → Required; malformed → Invalid format; zero → Must be greater than 0.
    // Read the reason for the incomeAmount field specifically — a submit emits a
    // form_error per invalid field, so the latest event overall may be another field.
    const incomeAmountReason = async (): Promise<string | undefined> => {
      const errs = await getEvents(page, 'screener_form_error');
      const forAmount = errs.filter((e) => e.form_field_name === 'incomeStreams.incomeAmount');
      return forAmount.length ? String(forAmount[forAmount.length - 1].form_error_reason) : undefined;
    };

    await page.locator(FORM_INPUTS.AMOUNT).fill('');
    await clickContinue(page);
    expect(await incomeAmountReason()).toBe('Required');

    await page.locator(FORM_INPUTS.AMOUNT).fill('0');
    await clickContinue(page);
    expect(await incomeAmountReason()).toBe('Must be greater than 0');
  });
});
