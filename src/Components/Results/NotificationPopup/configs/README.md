# ResultsPopup Configs

This directory contains popup configurations for the Results page. Each config defines when and how to show a popup (e.g., surveys, announcements).

## Example Reference

See [PR #1984](https://github.com/Gary-Community-Ventures/benefits-calculator/pull/1984) for the original implementation of the Urban Institute 2025 survey popup as a real-world example. Note: the `POPUP_ENABLED` flag was added later in [PR #2022](https://github.com/Gary-Community-Ventures/benefits-calculator/pull/2022).

## Creating a New Popup Config

### 1. Create the config file

Create a new file like `mySurvey.tsx`:

```tsx
import { FormattedMessage } from 'react-intl';
import { FormData } from '../../../../Types/FormData';

// Constants for your popup
const POPUP_ENABLED = true;
const ELIGIBLE_STATES = ['co', 'nc'] as const;
const ELIGIBLE_LOCALES = ['en', 'es'] as const;

/**
 * Checks if user is eligible to see the popup
 */
function checkEligibility(formData: FormData, whiteLabel: string | undefined, locale: string): boolean {
  // Check state
  if (!whiteLabel || !ELIGIBLE_STATES.includes(whiteLabel as any)) {
    return false;
  }

  // Check locale
  const localePrefix = locale.toLowerCase().split('-')[0];
  if (!ELIGIBLE_LOCALES.includes(localePrefix as any)) {
    return false;
  }

  // Add any other eligibility checks (age, household size, etc.)
  // Example: check head of household is 18+
  const headOfHousehold = formData.householdData?.[0];
  if (!headOfHousehold?.age || headOfHousehold.age < 18) {
    return false;
  }

  return true;
}

/**
 * Gets the popup configuration
 */
export function getMySurveyConfig(
  formData: FormData,
  whiteLabel: string | undefined,
  locale: string,
  uuid?: string,
) {
  // Build URL with any query params
  const baseUrl = 'https://example.com/survey';
  const surveyUrl = `${baseUrl}?id=${uuid ?? ''}`;

  return {
    shouldShow: () => POPUP_ENABLED && checkEligibility(formData, whiteLabel, locale),
    message: (
      <FormattedMessage
        id="resultsPopup.mySurvey.message"
        defaultMessage="Your popup message here"
      />
    ),
    linkUrl: surveyUrl,
    linkText: <FormattedMessage id="resultsPopup.mySurvey.button" defaultMessage="Take Survey" />,
    minimizedText: (
      <FormattedMessage id="resultsPopup.mySurvey.minimized" defaultMessage="Click to learn more" />
    ),
    startMinimized: true, // Set to false to show full popup immediately
  };
}
```

### 2. Add to Results.tsx

```tsx
// Add import
import { getMySurveyConfig } from './ResultsPopup/configs/mySurvey';

// Inside Results component, add useMemo
const popupConfig = useMemo(
  () => getMySurveyConfig(formData, whiteLabel, locale, uuid),
  [formData, whiteLabel, locale, uuid]
);

// Add component above ResultsHeader
<ResultsPopup {...popupConfig} />
```

### 3. Add translations

Add your FormattedMessage ids to the translation files:
- `resultsPopup.mySurvey.message`
- `resultsPopup.mySurvey.button`
- `resultsPopup.mySurvey.minimized`

## Config Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `shouldShow` | `() => boolean` | Yes | Function that returns whether to show the popup |
| `message` | `React.ReactNode` | Yes | Main message content |
| `linkUrl` | `string` | No | URL for the action button |
| `linkText` | `React.ReactNode` | No | Button text (default: "Learn More") |
| `minimizedText` | `React.ReactNode` | No | Text when minimized (default: "Click to learn more") |
| `startMinimized` | `boolean` | No | Start in minimized state (default: false) |

## Disabling a Popup

To temporarily disable: Set `POPUP_ENABLED = false` in the config file.

To permanently remove:
1. Remove the import from Results.tsx
2. Remove the `popupConfig` useMemo
3. Remove the `<ResultsPopup {...popupConfig} />` component
4. Delete the config file (git history preserves it if needed later)
