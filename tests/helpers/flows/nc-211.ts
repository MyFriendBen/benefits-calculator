/**
 * NC 211 Referrer Flow Helpers
 *
 * This file contains helper functions specific to the NC 211 referrer workflow,
 * composing common flow helpers into higher-level flows for this specific referrer.
 * 
 * Key Features:
 * - Reuses all common flow helpers from ./common.ts
 * - Maintains referrer parameter persistence throughout workflow
 * - Provides NC 211-specific entry point and session setup
 * - Follows same patterns as nc.ts for consistency
 */

import { Page } from '@playwright/test';
import { navigateToNC211Workflow, clickGetStarted, verifyCurrentUrl, verifyReferrerUrl } from '../navigation';
import {
  completeDisclaimer,
  completeLocationInfo,
  completeHouseholdSize,
  completePrimaryUserInfo,
  completeHouseholdMemberInfo,
  completeExpenses,
  completeAssets,
  completePublicBenefits,
  completeNeeds,
  completeReferralSource,
  completeAdditionalInfo,
  navigateToResults,
} from './common';
import { URL_PATTERNS, REFERRERS } from '../utils/constants';
import { ApplicationData, FlowResult } from './types';

/**
 * Sets up a test session for the NC 211 referrer workflow, getting to the first step after disclaimer
 * @param page - Playwright page instance
 * @returns Promise with flow result
 */
export async function setupNC211Session(page: Page): Promise<FlowResult> {
  try {
    // Navigate to NC 211 workflow with referrer parameter
    await navigateToNC211Workflow(page, REFERRERS.NC_211);
    
    // Verify we're on the correct landing page with referrer parameter
    await verifyCurrentUrl(page, URL_PATTERNS.LANDING_PAGE);
    await verifyReferrerUrl(page, REFERRERS.NC_211);

    // Click Get Started to proceed to disclaimer
    await clickGetStarted(page);

    // Verify we're on disclaimer page with referrer parameter maintained
    await verifyCurrentUrl(page, URL_PATTERNS.DISCLAIMER);
    await verifyReferrerUrl(page, REFERRERS.NC_211);

    // Complete disclaimer step
    const disclaimerResult = await completeDisclaimer(page);
    if (!disclaimerResult.success) {
      return disclaimerResult;
    }

    return { success: true, step: 'nc-211-session-setup' };
  } catch (error) {
    return {
      success: false,
      step: 'nc-211-session-setup',
      error: error as Error,
    };
  }
}

/**
 * Completes a full application for the NC 211 referrer workflow
 * Uses the same form steps as NC white label - only entry point differs
 * @param page - Playwright page instance
 * @param data - Application data to use for the test
 * @returns Promise with flow result
 */
export async function completeNC211FullApplication(page: Page, data: ApplicationData): Promise<FlowResult> {
  try {
    // Complete all form steps using shared helpers
    const steps = [
      () => completeLocationInfo(page, data.zipCode, data.county),
      () => completeHouseholdSize(page, data.householdSize),
      () => completePrimaryUserInfo(page, data.primaryUser),
      () => completeHouseholdMemberInfo(page, data.householdMember),
      () => completeExpenses(page, data.expenses),
      () => completeAssets(page, data.assets),
      () => completePublicBenefits(page),
      () => completeNeeds(page, data.needs),
      () => completeReferralSource(page, data.referralSource),
      () => completeAdditionalInfo(page),
      () => navigateToResults(page),
    ];

    // Execute each step and return early on failure
    for (const step of steps) {
      const result = await step();
      if (!result.success) return result;
    }

    return { success: true, step: 'nc-211-full-application' };
  } catch (error) {
    return {
      success: false,
      step: 'nc-211-full-application',
      error: error as Error,
    };
  }
}
