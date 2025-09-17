import { test, expect } from '@playwright/test';
import {
  acceptDisclaimer,
  clickContinueButton,
  clickGetStartedButton,
  fillDateOfBirth,
  fillHouseholdSize,
  fillZipCode,
  navigateHomePage,
  selectCounty,
  selectInsurance,
  selectNearTermNeeds,
  selectReferralSource,
  selectState,
} from './helpers/steps';
import {
  selectElectricProvider,
  selectHeatingSource,
  selectHouseholdInfo,
  selectNoBenefit,
  selectOwnerOrRenter,
  selectStatus,
  selectUtility,
} from './helpers/energy-calculator';
import { URL_PATTERNS } from './helpers/utils/constants';
import { verifyCurrentUrl } from './helpers/navigation';

const whiteLabels = {
  nc: {
    state: 'North Carolina',
    zipcode: '27708',
    county: '',
    householdSize: 1,
    dobMonth: 'February',
    dobYear: '1989',
    insurance: "I don't have or know if I have health insurance",
    nearTermNeeds: ['Food or groceries'],
    referralSource: 'Test / Prospective Partner',
    expectedResult: {
      programsCount: '3Programs Found',
      estimatedMonthlySavings: '$813Estimated Monthly Savings',
      annualTaxCredit: '$0Annual Tax Credit',
    },
  },
  co: {
    state: 'Colorado',
    zipcode: '80012',
    county: 'Denver County',
    householdSize: 1,
    dobMonth: 'February',
    dobYear: '1989',
    insurance: "I don't have or know if I have health insurance",
    nearTermNeeds: ['Food or groceries'],
    referralSource: 'Test / Prospective Partner',
    expectedResult: {
      programsCount: '5Programs Found',
      estimatedMonthlySavings: '$672Estimated Monthly Savings',
      annualTaxCredit: '$177Annual Tax Credit',
    },
  },
  ma: {
    state: 'Macachusetts',
    zipcode: '',
    county: '',
    householdSize: 1,
    dobMonth: 'February',
    dobYear: '1989',
    insurance: "I don't have or know if I have health insurance",
    nearTermNeeds: ['Food or groceries'],
    referralSource: 'Test / Prospective Partner',
    expectedResult: {
      programsCount: '5Programs Found',
      estimatedMonthlySavings: '$672Estimated Monthly Savings',
      annualTaxCredit: '$177Annual Tax Credit',
    },
  },
};

const energyCalculators = {
  co_energy_calculator: {
    ownerOrRenter: 'Renter',
    utility: 'Heating',
    zipcode: '80012',
    county: 'Denver County',
    householdSize: 1,
    dobMonth: 'February',
    dobYear: '1989',
    status: 'Widowed',
    electricProvider: 'Xcel Energy',
    heatingSource: 'Xcel Energy',
    householdInfo: 'You have a past-due electric',
    noBenefit: true,
    expectedResult: {
      programsCount: '7Programs Found8Rebates Found',
    },
  },
};
test.describe('Basic e2e tests for each white label', () => {
  for (const [whiteLabel, config] of Object.entries(whiteLabels)) {
    const skip = whiteLabel === 'ma'; // skipping MA for now
    const runner = skip ? test.skip : test;

    runner(`${whiteLabel.toUpperCase()} white label`, async ({ page }) => {
      await navigateHomePage(page);
      await clickGetStartedButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.SELECT_STATE);

      await selectState(page, config.state);
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.DISCLAIMER);

      await acceptDisclaimer(page);
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.LOCATION_INFO);

      await fillZipCode(page, config.zipcode);
      if (config.county !== '') {
        await selectCounty(page, config.county);
      }
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_SIZE);

      await fillHouseholdSize(page, config.householdSize);
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.HOUSEHOLD_MEMBER);

      await fillDateOfBirth(page, config.dobMonth, config.dobYear);
      await selectInsurance(page, config.insurance);
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.EXPENSES);

      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.ASSETS);

      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.PUBLIC_BENEFITS);

      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.NEEDS);

      await selectNearTermNeeds(page, config.nearTermNeeds);
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.REFERRAL_SOURCE);

      await selectReferralSource(page, config.referralSource);
      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.ADDITIONAL_INFO);

      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.CONFIRM_INFORMATION);

      await clickContinueButton(page);
      await verifyCurrentUrl(page, URL_PATTERNS.RESULTS);

      await page.locator('.results-header').waitFor({ state: 'visible' });
      await expect(page.locator('.results-header .results-header-programs-count-text')).toHaveText(
        config.expectedResult.programsCount,
      );
      await expect(page.locator('.results-header .results-data-cell').first()).toHaveText(
        config.expectedResult.estimatedMonthlySavings,
      );
      await expect(page.locator('.results-header .results-data-cell').last()).toHaveText(
        config.expectedResult.annualTaxCredit,
      );
    });
  }

  test('Energy Calculator White label', async ({ page }) => {
    await navigateHomePage(page, '/co_energy_calculator/landing-page');
    await selectOwnerOrRenter(page, energyCalculators.co_energy_calculator.ownerOrRenter);
    await clickGetStartedButton(page);
    await expect(page).toHaveURL('/co_energy_calculator/step-2?path=renter');

    await acceptDisclaimer(page);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-3/);

    await selectUtility(page, energyCalculators.co_energy_calculator.utility);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-4/);

    await fillZipCode(page, energyCalculators.co_energy_calculator.zipcode);
    await selectCounty(page, energyCalculators.co_energy_calculator.county);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-5/);

    await fillHouseholdSize(page, 1);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-6/);

    await fillDateOfBirth(
      page,
      energyCalculators.co_energy_calculator.dobMonth,
      energyCalculators.co_energy_calculator.dobYear,
    );
    await selectStatus(page, energyCalculators.co_energy_calculator.status);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-7/);

    await selectElectricProvider(page, energyCalculators.co_energy_calculator.electricProvider);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-8/);

    await selectHeatingSource(page, energyCalculators.co_energy_calculator.heatingSource);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-9/);

    await selectHouseholdInfo(page, energyCalculators.co_energy_calculator.householdInfo);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/step-10/);

    await selectNoBenefit(page);
    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/confirm-information/);

    await clickContinueButton(page);
    await expect(page).toHaveURL(/\/co_energy_calculator\/.*\/results\/benefits/);

    await page.locator('header.energy-calculator-results-header').waitFor({ state: 'visible' });
    await expect(page.locator('header.energy-calculator-results-header')).toHaveText(
      energyCalculators.co_energy_calculator.expectedResult.programsCount,
    );
  });
});
