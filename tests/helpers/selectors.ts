/**
 * Selectors - Common selectors used across the application tests
 *
 * This file contains reusable selectors for common UI elements to ensure
 * consistency across tests and make maintenance easier if selectors change.
 */

/**
 * Navigation and button selectors
 */
export const BUTTONS = {
  CONTINUE: { role: 'button' as const, name: 'Continue' },
  GET_STARTED: { role: 'button' as const, name: /get started/i },
  SAVE_RESULTS: { role: 'button' as const, name: 'save my results' },
};

/**
 * Form input selectors
 */
export const FORM_INPUTS = {
  // Dropdowns
  STATE_SELECT: '#state-source-select',
  COUNTY_SELECT: '#county-source-select',
  REFERRAL_SOURCE_SELECT: '#referral-source-select',
  RELATIONSHIP_SELECT: '#relationship-to-hh-select',

  // Text inputs
  ZIP_CODE: { role: 'textbox' as const, name: 'Zip Code' },
  HOUSEHOLD_SIZE: { role: 'textbox' as const, name: 'Household Size' },
  AMOUNT: { role: 'textbox' as const, name: 'Amount' },
  DOLLAR_AMOUNT: { role: 'textbox' as const, name: 'Dollar Amount' },

  // Checkboxes
  DISCLAIMER_CHECKBOX_1: { role: 'checkbox' as const, name: 'By proceeding, you confirm' },
  DISCLAIMER_CHECKBOX_2: { role: 'checkbox' as const, name: 'I confirm I am 13 years of' },

  SIGNUP_CHECKBOX_1: { role: 'checkbox' as const, name: 'Please notify me when new benefits' },
  SIGNUP_CHECKBOX_2: { role: 'checkbox' as const, name: 'Please notify me about other programs or opportunities' },

  // Radio buttons
  YES_RADIO: { role: 'radio' as const, name: 'Yes' },

  // Date selectors
  BIRTH_MONTH: { role: 'button' as const, name: 'Birth Month' },
  YEAR_SELECTOR: { role: 'button' as const, name: 'Open' },
};

/**
 * Language selector - uses multiple possible selectors
 */
export const LANGUAGE_SELECTOR = 'select, [aria-label*="language"], [data-testid*="language"]';

/**
 * Common option selectors
 */
export const OPTION = {
  byName: (name: string) => ({ role: 'option' as const, name }),
};

/**
 * Common dropdown button selectors
 */
export const DROPDOWN = {
  INCOME_TYPE: { role: 'button' as const, name: 'Income Type' },
  EXPENSE_TYPE: { role: 'button' as const, name: 'Expense Type' },
  FREQUENCY: { role: 'button' as const, name: 'Frequency' },
};

/**
 * NC 211 specific selectors
 */
export const NC_211 = {
  // Header and branding
  COBRANDED_LOGO: 'img[alt="211 and myfriendben logo"]',
  HEADER_CONTAINER: '#twoOneOne-nav-container',
  
  // Navigation menu links (multiple selector strategies for robustness)
  NAV_LINKS: {
    HOME: [
      'text="HOME"',
      'a[href*="nc211.org/"]:has-text("HOME")',
      '.twoOneOneMenuLink:has-text("HOME")',
      'nav a:has-text("HOME")'
    ],
    ABOUT: [
      'text="ABOUT"',
      'a[href*="about"]:has-text("ABOUT")',
      '.twoOneOneMenuLink:has-text("ABOUT")',
      'nav a:has-text("ABOUT")'
    ],
    AGENCIES: [
      'text="AGENCIES"',
      'a[href*="agencies"]:has-text("AGENCIES")',
      '.twoOneOneMenuLink:has-text("AGENCIES")',
      'nav a:has-text("AGENCIES")'
    ],
    RESOURCES: [
      'text="RESOURCES"',
      'a[href*="resources"]:has-text("RESOURCES")',
      '.twoOneOneMenuLink:has-text("RESOURCES")',
      'nav a:has-text("RESOURCES")'
    ]
  },
  
  // Footer elements (multiple selector strategies for robustness)
  FOOTER_ELEMENTS: {
    PHONE_ICON: [
      'img[alt="talk to a 2-1-1 navigator via phone"]',
      '.twoOneOneNC-footer-icon',
      'img.twoOneOneNC-footer-icon',
      '.footer-phone-icon'
    ],
    DIAL_LINKS: [
      'a[href="tel:211"]',
      'a:has-text("Dial 2-1-1")',
      'text="Dial 2-1-1"',
      'a[aria-label="211 dial link"]'
    ],
    TOLL_FREE_LINKS: [
      'a[href="tel:866-760-6489"]',
      'a:has-text("1-(888)-892-1162")',
      'text="1-(888)-892-1162"',
      'a[aria-label="211 dial link"]:has-text("888")'
    ],
    GET_HELP_TEXT: [
      'text="Not finding what you are looking for? Try calling 211 for help:"',
      'text*="Not finding what you are looking for"',
      'text*="Try calling 211 for help"',
      '.getHelp-text'
    ]
  },
  
  // Footer text content (multiple selector strategies)
  FOOTER_TEXT: {
    DISCLAIMER: [
      'text*="Services found within search results may involve eligibility criteria"',
      'text*="Please contact the resource directly"',
      'p:has-text("Services found within search results")',
      '.first-paragraph'
    ],
    NC_211_INFO: [
      'text*="NC 211 is an information and referral service provided by United Way"',
      'text*="powered by local United Ways"',
      'p:has-text("NC 211 is an information")',
      '.second-paragraph'
    ],
    COPYRIGHT: [
      'text="© Copyright 2-1-1 North Carolina"',
      'text*="Copyright 2-1-1"',
      'p:has-text("© Copyright 2-1-1")',
      '.privacy-policy-links'
    ]
  },
  
  // Privacy policy links (multiple selector strategies)
  PRIVACY_LINKS: {
    NC_211_POLICY: [
      'a:has-text("2-1-1 Privacy Policy")',
      'a[href*="privacy"]:has-text("2-1-1")',
      'text="2-1-1 Privacy Policy"',
      '.nc-211-privacy-link'
    ],
    MFB_POLICY: [
      'a:has-text("MyFriendBen Privacy Policy")',
      'a[href*="privacy"]:has-text("MyFriendBen")',
      'text="MyFriendBen Privacy Policy"',
      '.mfb-privacy-link'
    ]
  },
  
  // Language selector (NC 211 specific)
  LANGUAGE_SELECTOR_NC: '#twoOneOne-NC-select-language',
  GLOBE_ICON: '[data-testid="LanguageIcon"]',
  
  // Share button
  SHARE_BUTTON: { role: 'button' as const, name: /share button/i },
};
