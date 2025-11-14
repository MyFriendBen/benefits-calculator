import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import { FormData } from '../../../Types/FormData';
import ResultsPopup from '../ResultsPopup/ResultsPopup';

/**
 * URBAN INSTITUTE SURVEY - November/December 2025
 *
 * This component displays a survey invitation for a research study conducted by the Urban Institute.
 * The survey will run until 300 respondents complete it (expected completion: Nov/Dec 2025).
 *
 * Survey Details:
 * - Compensation: $10 Amazon gift card
 * - Duration: ~5 minutes
 * - Target states: Colorado and North Carolina only
 * - Target demographic: Adults over 18 years old
 * - Languages: English and Spanish
 *
 * This is a specific instance/wrapper of the generic ResultsPopup component.
 * All survey-specific logic (eligibility, messaging, URL, styling, timing) is contained here.
 */

/**
 * Checks if user is eligible to see the Urban Institute survey popup
 *
 * Eligibility criteria:
 * - User is in Colorado (whiteLabel is 'co') or North Carolina (whiteLabel is 'nc')
 * - User is 18 years old or older (head of household age >= 18)
 */
function checkSurveyEligibility(formData: FormData, whiteLabel: string): boolean {
  // Check state from whiteLabel
  const isColorado = whiteLabel === 'co';
  const isNorthCarolina = whiteLabel === 'nc';

  if (!isColorado && !isNorthCarolina) {
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

  if (headOfHousehold.age < 18) {
    return false;
  }

  return true;
}

/**
 * SurveyPopup component - Urban Institute Survey (Nov/Dec 2025)
 *
 * A specific instance of ResultsPopup configured for the Urban Institute survey invitation.
 * This wrapper component handles all survey-specific logic including:
 * - Eligibility checks (CO/NC residents, age 18+)
 * - Survey-specific messaging and compensation details ($10 gift card)
 * - Link to the external survey platform
 * - Orange color theme and 5-second delay timing
 * - Survey displays in the user's selected language (English or Spanish)
 *
 * To remove this survey after reaching 300 respondents:
 * Simply remove the <SurveyPopup /> line from Results.tsx (line ~265)
 *
 * @see ResultsPopup - The reusable popup component this wraps
 */
const SurveyPopup = () => {
  const { formData } = useContext(Context);
  const { whiteLabel } = useParams();

  return (
    <ResultsPopup
      shouldShow={() => checkSurveyEligibility(formData, whiteLabel ?? '')}
      message={
        <FormattedMessage
          id="results.popup.surveyMessage"
          defaultMessage="Help us improve MyFriendBen! Share your feedback in a quick 5-minute survey and receive a $10 Amazon gift card as a thank you."
        />
      }
      linkUrl="https://your-survey-link.com"
      linkText={<FormattedMessage id="results.popup.surveyLink" defaultMessage="Take Survey" />}
      minimizedText={<FormattedMessage id="results.popup.surveyMinimized" defaultMessage="Help Us Improve - Get $10" />}
      colorTheme="orange"
      initialState="minimized"
    />
  );
};

export default SurveyPopup;
