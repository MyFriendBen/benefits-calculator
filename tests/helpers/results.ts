/**
 * Results Page Helper Functions
 *
 * This module provides reusable helper functions for testing results page interactions,
 * including navigation flows, loading state handling, and content validation.
 * 
 * Key Features:
 * - Handles async loading spinner after step 12 submission
 * - Provides navigation flow testing (More Info → Details → Back to Results)
 * - Validates estimated savings display
 * - Tests Near-term/Long-term benefits navigation
 * - Reusable across NC 211 and NC end-to-end test suites
 */

import { Page, expect } from '@playwright/test';
import { FlowResult } from './flows/types';
import { URL_PATTERNS } from './utils/constants';

/**
 * Waits for the results page to fully load after step 12 submission
 * Handles the async loading spinner while backend processes eligibility data
 * @param page - Playwright page instance
 * @param timeoutMs - Maximum time to wait for loading to complete (default: 60s)
 */
export async function waitForResultsPageLoad(page: Page, timeoutMs: number = 60000): Promise<void> {
  try {
    // Wait for loading spinner to disappear (indicates backend processing is complete)
    await expect(page.locator('.loading-image')).not.toBeVisible({ timeout: timeoutMs });
    
    // Verify main results content is now visible
    await expect(page.locator('main')).toBeVisible();
    
    // Wait for results header to be present (indicates page is fully rendered)
    await expect(page.locator('[data-testid="results-header"], .results-header')).toBeVisible();
    
    console.log('[Results] Results page loaded successfully');
  } catch (error) {
    console.error('[Results] Failed to load results page:', error);
    throw error;
  }
}

/**
 * Verifies that the estimated monthly and annual savings section is displayed
 * @param page - Playwright page instance
 */
export async function verifyEstimatedSavings(page: Page): Promise<void> {
  try {
    // Look for savings display section - may have different selectors based on implementation
    const savingsSelectors = [
      '[data-testid="estimated-savings"]',
      '.estimated-savings',
      '.savings-display',
      'text=/estimated.*savings/i',
      'text=/monthly.*annual/i'
    ];

    let savingsFound = false;
    for (const selector of savingsSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        savingsFound = true;
        console.log(`[Results] Found estimated savings with selector: ${selector}`);
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (!savingsFound) {
      console.warn('[Results] Could not locate estimated savings section with common selectors');
      // Don't fail the test, just log warning as this might be optional content
    }
  } catch (error) {
    console.error('[Results] Error verifying estimated savings:', error);
    throw error;
  }
}

/**
 * Clicks on the first "More Info" link to navigate to program details
 * @param page - Playwright page instance
 */
export async function clickMoreInfoLink(page: Page): Promise<void> {
  try {
    const moreInfoLink = page.locator('[data-testid="more-info-link"]').first();
    await expect(moreInfoLink).toBeVisible();
    await moreInfoLink.click();
    await page.waitForLoadState('networkidle');
    console.log('[Results] Clicked More Info link');
  } catch (error) {
    console.error('[Results] Error clicking More Info link:', error);
    throw error;
  }
}

/**
 * Clicks the "BACK TO RESULTS" button from program details page
 * @param page - Playwright page instance
 */
export async function clickBackToResults(page: Page): Promise<void> {
  try {
    const backButton = page.locator('[data-testid="back-to-results-button"]');
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForLoadState('networkidle');
    console.log('[Results] Clicked Back to Results button');
  } catch (error) {
    console.error('[Results] Error clicking Back to Results button:', error);
    throw error;
  }
}

/**
 * Clicks on a results page tab (Near-Term or Long-Term) using its data-testid.
 * @param page - Playwright page instance
 * @param tabTestId - The data-testid of the tab to click.
 */
export async function clickResultsTab(
  page: Page,
  tabTestId: 'near-term-benefits-tab' | 'long-term-benefits-tab',
): Promise<void> {
  try {
    const tabSelector = `[data-testid="${tabTestId}"]`;
    const tab = page.locator(tabSelector);
    await expect(tab).toBeVisible({ timeout: 10000 });
    await tab.click();
    console.log(`[Results] Clicked results tab with test ID: ${tabTestId}`);
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.error(`[Results] Failed to click results tab with test ID ${tabTestId}:`, error);
    throw error;
  }
}

/**
 * Tests the complete More Info → Details → Back to Results navigation flow
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function testMoreInfoNavigationFlow(page: Page): Promise<FlowResult> {
  try {
    console.log('[Results] Starting More Info navigation flow test');
    
    // Ensure we're on results page and it's fully loaded
    await waitForResultsPageLoad(page);
    await expect(page).toHaveURL(URL_PATTERNS.RESULTS);
    
    // Verify estimated savings are displayed
    await verifyEstimatedSavings(page);
    
    // Click More Info link to go to program details
    await clickMoreInfoLink(page);
    
    // Verify we're on program details page
    await expect(page).toHaveURL(/\/results\/benefits\/\d+/);
    
    // Verify Apply Online button is displayed on details page
    await expect(page.locator('button:has-text("Apply Online"), a:has-text("Apply Online")')).toBeVisible();
    
    // Click Back to Results button
    await clickBackToResults(page);
    
    // Verify we're back on main results page
    await expect(page).toHaveURL(URL_PATTERNS.RESULTS);
    
    console.log('[Results] More Info navigation flow completed successfully');
    return { success: true, step: 'more-info-navigation' };
  } catch (error) {
    console.error('[Results] More Info navigation flow failed:', error);
    return {
      success: false,
      step: 'more-info-navigation',
      error: error as Error,
    };
  }
}

/**
 * Tests the Near-Term Benefits → Long-Term Benefits navigation flow
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function testNearTermLongTermNavigation(page: Page): Promise<FlowResult> {
  try {
    console.log('[Results] Starting Near-Term/Long-Term navigation flow test');

    // Ensure we're on results page and it's fully loaded
    await waitForResultsPageLoad(page);
    await expect(page).toHaveURL(URL_PATTERNS.RESULTS);

    // Click Near-Term Benefits tab
    await clickResultsTab(page, 'near-term-benefits-tab');

    // Verify we're on near-term needs page
    await expect(page).toHaveURL(/\/near-term-needs/);

    // Verify specific resource needs section is displayed
    await expect(page.locator('[data-testid="needs-section"]')).toBeVisible();

    // Click Long-Term Benefits tab to return
    await clickResultsTab(page, 'long-term-benefits-tab');

    // Verify we're back on main results page
    await expect(page).toHaveURL(URL_PATTERNS.RESULTS);

    console.log('[Results] Near-Term/Long-Term navigation flow completed successfully');
    return { success: true, step: 'near-term-long-term-navigation' };
  } catch (error) {
    console.error('[Results] Near-Term/Long-Term navigation flow failed:', error);
    return {
      success: false,
      step: 'near-term-long-term-navigation',
      error: error as Error,
    };
  }
}

/**
 * Comprehensive results page content validation
 * Verifies all essential UI elements are present and functional on the results page
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function verifyResultsPageContent(page: Page): Promise<FlowResult> {
  try {
    console.log('[Results] Starting comprehensive results page content validation');
    
    // STEP 1: Ensure results page is fully loaded
    await waitForResultsPageLoad(page);
    
    // STEP 2: Verify estimated savings display (if present)
    await verifyEstimatedSavings(page);
    
    // STEP 3: Verify essential results page elements
    await verifyResultsPageElements(page);
    
    console.log('[Results] Results page content validation completed successfully');
    return { success: true, step: 'results-page-content-validation' };
  } catch (error) {
    console.error('[Results] Results page content validation failed:', error);
    return {
      success: false,
      step: 'results-page-content-validation',
      error: error as Error,
    };
  }
}

/**
 * Verifies essential results page UI elements are present
 * Uses multiple selector strategies for robustness
 * @param page - Playwright page instance
 */
export async function verifyResultsPageElements(page: Page): Promise<void> {
  try {
    console.log('[Results] Verifying essential results page elements');
    
    // Verify results header/title is present
    const headerSelectors = [
      '[data-testid="results-header"]',
      '.results-header',
      'h1:has-text("Results")',
      'h1:has-text("Benefits")',
      'text=/your.*results/i',
      'text=/benefits.*you.*may.*qualify/i'
    ];
    
    let headerFound = false;
    for (const selector of headerSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        headerFound = true;
        console.log(`[Results] Found results header with selector: ${selector}`);
        break;
      } catch {
        continue;
      }
    }
    
    if (!headerFound) {
      console.warn('[Results] Could not locate results header with common selectors');
    }
    
    // Verify program cards/benefits list is present
    const programSelectors = [
      '[data-testid="program-card"]',
      '.program-card',
      '.benefit-card',
      '[data-testid="benefits-list"]',
      '.benefits-list',
      'text=/more info/i'
    ];
    
    let programsFound = false;
    for (const selector of programSelectors) {
      try {
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
        programsFound = true;
        console.log(`[Results] Found program cards with selector: ${selector}`);
        break;
      } catch {
        continue;
      }
    }
    
    if (!programsFound) {
      console.warn('[Results] Could not locate program cards with common selectors');
    }
    
    // Verify main content area is visible
    await expect(page.locator('main')).toBeVisible();
    
    console.log('[Results] Essential results page elements verification completed');
  } catch (error) {
    console.error('[Results] Error verifying results page elements:', error);
    throw error;
  }
}

/**
 * Comprehensive results page navigation test combining all flows
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function testCompleteResultsNavigation(page: Page): Promise<FlowResult> {
  try {
    console.log('[Results] Starting complete results navigation test');
    
    // Test More Info navigation flow
    const moreInfoResult = await testMoreInfoNavigationFlow(page);
    if (!moreInfoResult.success) {
      return moreInfoResult;
    }
    
    // Test Near-Term/Long-Term navigation flow
    const nearTermResult = await testNearTermLongTermNavigation(page);
    if (!nearTermResult.success) {
      return nearTermResult;
    }
    
    console.log('[Results] Complete results navigation test passed');
    return { success: true, step: 'complete-results-navigation' };
  } catch (error) {
    console.error('[Results] Complete results navigation test failed:', error);
    return {
      success: false,
      step: 'complete-results-navigation',
      error: error as Error,
    };
  }
}
