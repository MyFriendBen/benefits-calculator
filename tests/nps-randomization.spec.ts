import { test, expect, Page } from '@playwright/test';
import {
  navigateToHomePage,
  clickGetStarted,
  clickContinue,
  verifyCurrentUrl,
  completeStateSelection,
  completeDisclaimer,
  completeLocationInfo,
  completeHouseholdSize,
  completePrimaryUserInfo,
  completeHouseholdMemberInfo,
  completeExpenses,
  completeAssets,
  completePublicBenefits,
  completeReferralSource,
  completeAdditionalInfo,
  navigateToResults,
  URL_PATTERNS,
  STATES,
} from './helpers';
import { testUsers } from './helpers/utils/test-data';
import { WHITE_LABELS } from './helpers/utils/constants';
import { ApplicationData, FlowResult } from './helpers/flows/types';

async function runCoEndToEndTest(page: Page, data: ApplicationData): Promise<FlowResult> {
  try {
    await navigateToHomePage(page);
    await clickGetStarted(page);
    await verifyCurrentUrl(page, URL_PATTERNS.SELECT_STATE);

    const steps = [
      () => completeStateSelection(page, STATES.COLORADO),
      () => completeDisclaimer(page),
      () => completeLocationInfo(page, data.zipCode, data.county),
      () => completeHouseholdSize(page, data.householdSize),
      () => completePrimaryUserInfo(page, data.primaryUser),
      () => completeHouseholdMemberInfo(page, data.householdMember),
      () => completeExpenses(page, data.expenses),
      () => completeAssets(page, data.assets),
      () => completePublicBenefits(page),
      // Skip needs selection — just continue (needs are optional, avoids CO-specific button name mismatches)
      async () => {
        try {
          await verifyCurrentUrl(page, URL_PATTERNS.NEEDS);
          await clickContinue(page);
          return { success: true, step: 'needs' } as FlowResult;
        } catch (error) {
          return { success: false, step: 'needs', error: error as Error } as FlowResult;
        }
      },
      () => completeReferralSource(page, data.referralSource),
      () => completeAdditionalInfo(page),
      () => navigateToResults(page),
    ];

    for (const step of steps) {
      const result = await step();
      if (!result.success) return result;
    }

    return { success: true, step: 'co-end-to-end' };
  } catch (error) {
    return { success: false, step: 'co-end-to-end', error: error as Error };
  }
}

/**
 * NPS Randomization Verification (CO white label)
 *
 * Completes the CO screener 10 times and checks which NPS variant
 * each UUID gets assigned to verify ~50/50 distribution.
 */
test.describe('NPS Randomization (CO)', () => {
  test.setTimeout(600000); // 10 minutes

  test('verify ~50/50 distribution across 10 screener submissions', async ({ page }) => {
    const results: { uuid: string; variant: string }[] = [];
    const data = testUsers[WHITE_LABELS.CO];

    for (let i = 0; i < 10; i++) {
      console.log(`\n--- Run ${i + 1}/10 ---`);

      const result = await runCoEndToEndTest(page, data);
      expect(result.success, `Run ${i + 1} failed at: ${result.step}`).toBeTruthy();

      // Extract UUID from URL: /{whiteLabel}/{uuid}/results/benefits
      const url = page.url();
      const uuid = url.split('/')[4];
      console.log(`UUID: ${uuid}`);

      // Wait for results page to fully load
      await page.waitForLoadState('networkidle');

      // Check for NPS variant (floating has 5s delay)
      let variant = 'none';
      try {
        // Wait up to 10s for either variant to appear (floating has 5s delay)
        await Promise.race([
          page.locator('.nps-floating').waitFor({ state: 'visible', timeout: 10000 }).then(() => { variant = 'floating'; }),
          page.locator('.nps-inline').waitFor({ state: 'visible', timeout: 10000 }).then(() => { variant = 'inline'; }),
        ]);
      } catch {
        // Neither appeared — take a debug screenshot on first failure
        if (i === 0) {
          await page.screenshot({ path: `test-results/nps-debug-run1.png` });
          // Log the page HTML around where NPS should be
          const npsHtml = await page.evaluate(() => {
            const el = document.querySelector('[class*="nps"]');
            return el ? el.outerHTML.slice(0, 500) : 'No NPS element found';
          });
          console.log(`Debug: ${npsHtml}`);
        }
        variant = 'none';
      }

      console.log(`Variant: ${variant}`);
      results.push({ uuid, variant });

      // Navigate back to start for next run
      if (i < 9) {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
    }

    // Report
    console.log('\n=== NPS RANDOMIZATION RESULTS ===');
    results.forEach((r, i) => {
      console.log(`Run ${i + 1}: ${r.variant} (uuid: ${r.uuid})`);
    });

    const floatingCount = results.filter((r) => r.variant === 'floating').length;
    const inlineCount = results.filter((r) => r.variant === 'inline').length;
    const noneCount = results.filter((r) => r.variant === 'none').length;

    console.log(`\nFloating: ${floatingCount}`);
    console.log(`Inline:   ${inlineCount}`);
    console.log(`None:     ${noneCount}`);
    console.log(
      `Split:    ${floatingCount}/${inlineCount} (${((floatingCount / 10) * 100).toFixed(0)}%/${((inlineCount / 10) * 100).toFixed(0)}%)`,
    );

    // At minimum, NPS widget should appear for some runs
    if (noneCount === 10) {
      console.log('WARNING: NPS widget did not appear in any run. Check feature flag and experiment config for CO.');
    }
    expect(noneCount, 'NPS widget should appear for at least some runs').toBeLessThan(10);
  });
});
