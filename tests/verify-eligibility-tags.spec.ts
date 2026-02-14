import { test, expect } from '@playwright/test';
import { runNcEndToEndTest, waitForResultsPageLoad, TEST_TIMEOUTS, VIEWPORTS } from './helpers';
import { testUsers } from './helpers/utils/test-data';
import { URL_PATTERNS } from './helpers/utils/constants';

test.describe('Verify Eligibility Tags Visual', () => {
  test.setTimeout(TEST_TIMEOUTS.END_TO_END);

  test('capture results page with eligibility tags', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);

    // Complete the NC flow (2-member household: adult + child)
    const result = await runNcEndToEndTest(page, testUsers.nc);
    expect(result.success, `Failed at: ${result.step}`).toBeTruthy();

    // Make sure we're on the results page and it's fully loaded
    await expect(page).toHaveURL(URL_PATTERNS.RESULTS, { timeout: 15000 });
    await waitForResultsPageLoad(page, 60000);

    // Wait for program cards to appear
    await expect(page.locator('.result-program-container').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000); // let rendering settle

    // Take a full-page screenshot of the results
    await page.screenshot({
      path: 'test-results/eligibility-tags-desktop-results.png',
      fullPage: true,
    });

    // Count and screenshot program cards
    const programCards = page.locator('.result-program-container');
    const cardCount = await programCards.count();
    console.log(`Found ${cardCount} program cards`);
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      await programCards.nth(i).screenshot({
        path: `test-results/eligibility-tags-card-${i + 1}.png`,
      });
    }

    // Check if any eligible member tags are present
    const eligibleLabels = page.locator('.eligible-members-container');
    const tagCount = await eligibleLabels.count();
    console.log(`Found ${tagCount} programs with eligibility tags`);
    expect(tagCount).toBeGreaterThan(0);

    const householdTags = page.locator('.eligible-member-tag:has-text("Household")');
    console.log(`Found ${await householdTags.count()} "Household" tags`);

    const youTags = page.locator('.eligible-member-tag:has-text("You")');
    console.log(`Found ${await youTags.count()} "You" tags`);

    const childTags = page.locator('.eligible-member-tag:has-text("Child")');
    console.log(`Found ${await childTags.count()} "Child" tags`);

    // Now test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'test-results/eligibility-tags-mobile-results.png',
      fullPage: true,
    });

    if (cardCount > 0) {
      await programCards.first().screenshot({
        path: 'test-results/eligibility-tags-mobile-card-1.png',
      });
    }
  });
});
