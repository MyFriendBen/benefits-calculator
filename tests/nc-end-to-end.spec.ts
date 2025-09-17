import { test, expect } from '@playwright/test';
import {
  runNcEndToEndTest,
  verifyCurrentUrl,
  saveResults,
  TEST_TIMEOUTS,
  testCompleteResultsNavigation,
  verifyFooterContent,
  verifyPrivacyPolicySection,
  verifyResultsPageContent,
  VIEWPORTS,
} from './helpers';
import { testUsers } from './helpers/utils/test-data';
import { URL_PATTERNS, WHITE_LABELS } from './helpers/utils/constants';

/**
 * NC Comprehensive Workflow Test
 *
 * Single continuous test that validates the complete NC user journey:
 * 1. Complete 12-step application workflow
 * 2. Results page validation and functionality
 * 3. Results navigation testing (More Info, Near-term/Long-term tabs)
 * 4. Footer and privacy policy validation
 */

test.describe('NC Comprehensive Workflow', () => {
  test.setTimeout(TEST_TIMEOUTS.END_TO_END);

  test('complete NC workflow with validation checkpoints', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.DESKTOP);
    
    // CHECKPOINT 1: Complete 12-Step Application Workflow
    console.log('Checkpoint 1: Complete NC application workflow');
    const result = await runNcEndToEndTest(page, testUsers[WHITE_LABELS.NC]);
    expect(result.success, `NC application workflow failed at step: ${result.step}`).toBeTruthy();
    
    // CHECKPOINT 2: Results Page Validation
    console.log('Checkpoint 2: Results page validation');
    await verifyCurrentUrl(page, URL_PATTERNS.RESULTS);
    
    // Verify comprehensive results page content (UI elements, loading, savings)
    const resultsContentResult = await verifyResultsPageContent(page);
    expect(resultsContentResult.success, `Results page content validation failed at step: ${resultsContentResult.step}`).toBeTruthy();
    
    // CHECKPOINT 3: Results Navigation Testing
    console.log('Checkpoint 3: Results navigation testing');
    const navResult = await testCompleteResultsNavigation(page);
    expect(navResult.success, `Results navigation failed at step: ${navResult.step}`).toBeTruthy();
    
    // CHECKPOINT 4: Footer and Privacy Policy Validation
    console.log('Checkpoint 4: Footer and privacy policy validation');
    await verifyFooterContent(page);
    await verifyPrivacyPolicySection(page);
    
    // Final verification and save
    await saveResults(page);
    
    console.log('✅ All checkpoints passed - NC comprehensive test completed successfully');
  });
});
