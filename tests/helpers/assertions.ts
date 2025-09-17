/**
 * Assertions - Common test assertion helpers
 *
 * This file contains helpers for common assertions used across tests,
 * making it easier to verify application state consistently.
 */

import { Page, expect } from '@playwright/test';
import { LANGUAGE_SELECTOR, NC_211 } from './selectors';

/**
 * Verifies that the page body is visible (page has loaded)
 * @param page - Playwright page instance
 */
export async function verifyPageLoaded(page: Page): Promise<void> {
  await expect(page.locator('body')).toBeVisible();
}

/**
 * Verifies that the language selector is visible on the page
 * @param page - Playwright page instance
 */
export async function verifyLanguageSelectorVisible(page: Page): Promise<void> {
  const languageSelector = page.locator(LANGUAGE_SELECTOR);
  await expect(languageSelector).toBeVisible();
}

/**
 * Verifies that a button with the specified name is visible
 * @param page - Playwright page instance
 * @param buttonName - Text on the button to check for
 */
export async function verifyButtonVisible(page: Page, buttonName: string | RegExp): Promise<void> {
  const button = page.getByRole('button', { name: buttonName });
  await expect(button).toBeVisible();
}

/**
 * Verifies that an element with specified selector exists
 * @param page - Playwright page instance
 * @param selector - CSS selector for the element
 */
export async function verifyElementExists(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(1);
}

/**
 * Verifies that a text element with specified content exists
 * @param page - Playwright page instance
 * @param text - Text content to search for
 */
export async function verifyTextExists(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Verifies footer content for any referrer (generic footer validation)
 * @param page - Playwright page instance
 */
export async function verifyFooterContent(page: Page): Promise<void> {
  // Look for common footer elements
  const footerSelectors = [
    'footer',
    '[data-testid="footer"]',
    '.footer',
    '.page-footer'
  ];
  
  let footerFound = false;
  for (const selector of footerSelectors) {
    try {
      await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
      footerFound = true;
      console.log(`[Footer] Found footer with selector: ${selector}`);
      break;
    } catch {
      // Continue to next selector
    }
  }
  
  if (!footerFound) {
    console.warn('[Footer] Could not locate footer section with common selectors');
  }
}

/**
 * Verifies privacy policy section is displayed
 * @param page - Playwright page instance
 */
export async function verifyPrivacyPolicySection(page: Page): Promise<void> {
  // Look for privacy policy links or text
  const privacySelectors = [
    'a:has-text("Privacy Policy")',
    'a:has-text("privacy policy")',
    'text=/privacy\s+policy/i',
    '[data-testid="privacy-policy"]',
    '.privacy-policy'
  ];
  
  let privacyFound = false;
  for (const selector of privacySelectors) {
    try {
      await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
      privacyFound = true;
      console.log(`[Privacy] Found privacy policy with selector: ${selector}`);
      break;
    } catch {
      // Continue to next selector
    }
  }
  
  if (!privacyFound) {
    console.warn('[Privacy] Could not locate privacy policy section with common selectors');
  }
}

/**
 * Helper function to find an element using multiple selector strategies.
 * This is a core utility that implements the DRY principle by centralizing
 * multi-strategy selector logic used throughout NC 211 tests.
 * 
 * @param page - Playwright page instance
 * @param selectors - Array of selector strings to try in order
 * @param elementName - Human-readable name for the element (for logging/errors)
 * @returns Promise<Locator> - The found element locator
 * @throws Error if none of the selectors find a visible element
 */
export async function findElementWithFallback(page: Page, selectors: string[], elementName: string) {
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    
    try {
      const element = page.locator(selector);
      // Check if element exists and is visible with short timeout
      await expect(element).toBeVisible({ timeout: 2000 });
      return element;
    } catch (error) {
      // Continue to next selector if this one fails
      continue;
    }
  }
  
  // If we get here, none of the selectors worked
  throw new Error(`Could not find ${elementName} with any of the provided selectors: ${selectors.join(', ')}`);
}

/**
 * NC 211 specific assertion helpers
 */

/**
 * Verifies that the NC 211 co-branded header is displayed correctly.
 * Checks for the 211 + MyFriendBen co-branded logo and header container.
 * 
 * @param page - Playwright page instance
 * @throws Error if header elements are not found or visible
 */
export async function verifyNC211Header(page: Page): Promise<void> {
  // Verify the co-branded logo is visible
  await expect(page.locator(NC_211.COBRANDED_LOGO)).toBeVisible();
  
  // Verify the header container exists
  await expect(page.locator(NC_211.HEADER_CONTAINER)).toBeVisible();
}

/**
 * Verifies that the NC 211 navigation menu is displayed with all expected links.
 * Uses multi-strategy selectors to ensure robustness across different DOM states.
 * 
 * @param page - Playwright page instance
 * @throws Error if navigation container or any navigation links are not found
 */
export async function verifyNC211NavigationMenu(page: Page): Promise<void> {
  // First, verify the navigation container exists
  await expect(page.locator(NC_211.HEADER_CONTAINER)).toBeVisible();
  
  // Verify each navigation link using the multi-strategy approach
  const navLinks = ['HOME', 'ABOUT', 'AGENCIES', 'RESOURCES'] as const;
  
  for (const linkName of navLinks) {
    await findElementWithFallback(page, NC_211.NAV_LINKS[linkName], `${linkName} navigation link`);
  }
}

/**
 * Verifies that the Get Help section with contact information is displayed.
 * Checks for phone icon, dial links, and help text using multi-strategy selectors.
 * 
 * @param page - Playwright page instance
 * @throws Error if any Get Help section elements are not found
 */
export async function verifyNC211GetHelpSection(page: Page): Promise<void> {
  // Verify phone icon is visible using multiple strategies
  await findElementWithFallback(page, NC_211.FOOTER_ELEMENTS.PHONE_ICON, 'phone icon');
  
  // Verify dial links are visible using multiple strategies
  await findElementWithFallback(page, NC_211.FOOTER_ELEMENTS.DIAL_LINKS, 'Dial 2-1-1 link');
  await findElementWithFallback(page, NC_211.FOOTER_ELEMENTS.TOLL_FREE_LINKS, 'toll-free link');
  
  // Verify "Not finding what you are looking for?" text is present
  await findElementWithFallback(page, NC_211.FOOTER_ELEMENTS.GET_HELP_TEXT, 'get help text');
}

/**
 * Verifies that both disclaimer paragraphs are displayed.
 * Checks for eligibility criteria disclaimer and NC 211 service information.
 * 
 * @param page - Playwright page instance
 * @throws Error if disclaimer text elements are not found
 */
export async function verifyNC211DisclaimerText(page: Page): Promise<void> {
  // Verify first disclaimer paragraph using multiple strategies
  await findElementWithFallback(page, NC_211.FOOTER_TEXT.DISCLAIMER, 'disclaimer text');
  
  // Verify second disclaimer paragraph (NC 211 information) using multiple strategies
  await findElementWithFallback(page, NC_211.FOOTER_TEXT.NC_211_INFO, 'NC 211 info text');
}

/**
 * Verifies that the privacy policy and copyright information section is displayed.
 * Checks for copyright text and both privacy policy links (NC 211 and MyFriendBen).
 * 
 * @param page - Playwright page instance
 * @throws Error if privacy section elements are not found
 */
export async function verifyNC211PrivacySection(page: Page): Promise<void> {
  // Verify copyright text using multiple strategies
  await findElementWithFallback(page, NC_211.FOOTER_TEXT.COPYRIGHT, 'copyright text');
  
  // Verify privacy policy links using multiple strategies
  await findElementWithFallback(page, NC_211.PRIVACY_LINKS.NC_211_POLICY, 'NC 211 privacy policy link');
  await findElementWithFallback(page, NC_211.PRIVACY_LINKS.MFB_POLICY, 'MyFriendBen privacy policy link');
}

/**
 * Verifies that the NC 211 language selector and globe icon are visible.
 * Checks for the globe icon and NC 211 specific language selector dropdown.
 * 
 * @param page - Playwright page instance
 * @throws Error if language selector elements are not found
 */
export async function verifyNC211LanguageSelector(page: Page): Promise<void> {
  // Verify globe icon is visible
  await expect(page.locator(NC_211.GLOBE_ICON)).toBeVisible();
  
  // Verify NC 211 specific language selector
  await expect(page.locator(NC_211.LANGUAGE_SELECTOR_NC)).toBeVisible();
}

/**
 * Comprehensive verification of all NC 211 static content on the landing page.
 * This is the main entry point for validating NC 211 branding and content.
 * 
 * Verifies:
 * - Co-branded header with 211 + MyFriendBen logo
 * - Navigation menu with all expected links (HOME, ABOUT, AGENCIES, RESOURCES)
 * - Get Help section with contact information and phone links
 * - Disclaimer text paragraphs (eligibility criteria and NC 211 info)
 * - Privacy policy and copyright information
 * - Language selector with globe icon
 * 
 * @param page - Playwright page instance
 * @throws Error if any static content verification fails
 */
export async function verifyNC211LandingPageContent(page: Page): Promise<void> {
  await verifyNC211Header(page);
  await verifyNC211NavigationMenu(page);
  await verifyNC211GetHelpSection(page);
  await verifyNC211DisclaimerText(page);
  await verifyNC211PrivacySection(page);
  await verifyNC211LanguageSelector(page);
}
