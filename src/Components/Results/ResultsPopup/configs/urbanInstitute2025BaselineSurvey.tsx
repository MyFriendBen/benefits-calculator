import { FormattedMessage } from 'react-intl';
import { FormData } from '../../../../Types/FormData';

/**
 * URBAN INSTITUTE 2025 BASELINE SURVEY - November/December 2025
 *
 * This file contains the configuration for the Urban Institute 2025 Baseline Survey popup.
 * The survey will run until 300 respondents complete it (expected completion: ~Jan 2026).
 *
 * Survey Details:
 * - Compensation: $10 Amazon gift card
 * - Duration: ~5 minutes
 * - Target states: Colorado and North Carolina only
 * - Target demographic: Adults over 18 years old
 * - Languages: English and Spanish
 *
 * To remove this survey after reaching 300 respondents:
 * 1. Remove the import: import { getUrbanInstitute2025BaselineSurveyConfig } from './ResultsPopup/configs/urbanInstitute2025BaselineSurvey';
 * 2. Remove the popupConfig useMemo that calls getUrbanInstitute2025BaselineSurveyConfig(...)
 * 3. Remove the <ResultsPopup {...popupConfig} /> line from Results.tsx
 */

// Constants
const ELIGIBLE_STATES = ['co', 'nc'] as const;
const ELIGIBLE_LOCALES = ['en', 'es'] as const;
const MIN_AGE = 18;
const SURVEY_BASE_URL = 'https://urban.co1.qualtrics.com/jfe/form/SV_9EojHuKftrhVpmC';
const SPANISH_LOCALE = 'es';

/**
 * Checks if user is eligible to see the Urban Institute 2025 Baseline Survey popup
 *
 * Eligibility criteria:
 * - User is in Colorado (whiteLabel is 'co') or North Carolina (whiteLabel is 'nc')
 * - User is 18 years old or older (head of household age >= 18)
 * - User's locale is English ('en') or Spanish ('es')
 */
function checkSurveyEligibility(formData: FormData, whiteLabel: string | undefined, locale: string): boolean {
  // Check state from whiteLabel
  if (!whiteLabel) {
    return false;
  }

  const isEligibleState = ELIGIBLE_STATES.includes(whiteLabel as typeof ELIGIBLE_STATES[number]);

  if (!isEligibleState) {
    return false;
  }

  // Check locale (must be English or Spanish)
  // Support locale formats like 'en', 'en-US', 'es', 'es-MX', etc.
  const localePrefix = locale.toLowerCase().split('-')[0];
  const isEligibleLocale = ELIGIBLE_LOCALES.includes(localePrefix as typeof ELIGIBLE_LOCALES[number]);

  if (!isEligibleLocale) {
    return false;
  }

  // Check that householdData exists and is not empty
  if (!formData.householdData || formData.householdData.length === 0) {
    return false;
  }

  // Check age (must be 18 or older)
  // Find the head of household (first member)
  const headOfHousehold = formData.householdData[0];
  if (headOfHousehold.age === null || headOfHousehold.age === undefined) {
    return false;
  }

  if (headOfHousehold.age < MIN_AGE) {
    return false;
  }

  return true;
}

/**
 * Gets the Urban Institute 2025 Baseline Survey popup configuration
 *
 * @param formData - The user's form data for eligibility checking
 * @param whiteLabel - The state code (e.g., 'co', 'nc') - can be undefined if not set
 * @param locale - The user's selected language ('en' or 'es')
 * @param uuid - The screener ID to pass to the survey
 * @returns Configuration object to spread into ResultsPopup component
 */
export function getUrbanInstitute2025BaselineSurveyConfig(
  formData: FormData,
  whiteLabel: string | undefined,
  locale: string,
  uuid?: string
) {
  // Build the survey URL based on language
  const isSpanish = locale === SPANISH_LOCALE;
  const screenerId = uuid ?? '';

  const surveyUrl = isSpanish
    ? `${SURVEY_BASE_URL}?Q_Language=ES&screenerid=${screenerId}`
    : `${SURVEY_BASE_URL}?screenerid=${screenerId}`;

  return {
    shouldShow: () => checkSurveyEligibility(formData, whiteLabel, locale),
    message: (
      <FormattedMessage
        id="resultsPopup.urbanInstitute.message"
        defaultMessage="Help us improve MyFriendBen! Share your feedback in a quick 5-minute survey and receive a $10 Amazon gift card as a thank you."
      />
    ),
    linkUrl: surveyUrl,
    linkText: <FormattedMessage id="resultsPopup.urbanInstitute.button" defaultMessage="Take Survey" />,
    minimizedText: <FormattedMessage id="resultsPopup.urbanInstitute.minimized" defaultMessage="Help Us Improve - Get $10" />,
    startMinimized: true,
  };
}
