import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import { FormData } from '../../../Types/FormData';
import ResultsPopup from '../ResultsPopup/ResultsPopup';

/**
 * Checks if user is eligible to see the survey popup
 * Eligibility criteria:
 * - User is in Colorado (whiteLabel is 'co') or North Carolina (whiteLabel is 'nc')
 * - User is over 18 years old (head of household age > 18)
 * - User's language is English or Spanish
 */
function checkSurveyEligibility(formData: FormData, locale: string, whiteLabel: string): boolean {
  // Check state from whiteLabel
  const isColorado = whiteLabel === 'co';
  const isNorthCarolina = whiteLabel === 'nc';

  if (!isColorado && !isNorthCarolina) {
    return false;
  }

  // Check age (must be over 18)
  // Find the head of household (first member)
  const headOfHousehold = formData.householdData[0];
  if (!headOfHousehold?.age) {
    return false;
  }

  if (headOfHousehold.age <= 18) {
    return false;
  }

  // Check language (English or Spanish)
  const languagePrefix = locale.toLowerCase().substring(0, 2);
  if (languagePrefix !== 'en' && languagePrefix !== 'es') {
    return false;
  }

  return true;
}

/**
 * SurveyPopup component - A specific instance of ResultsPopup configured for survey invitations
 * This component handles all survey-specific logic including eligibility checks
 */
const SurveyPopup = () => {
  const { formData, locale } = useContext(Context);
  const { whiteLabel } = useParams();

  return (
    <ResultsPopup
      shouldShow={() => checkSurveyEligibility(formData, locale, whiteLabel ?? '')}
      message={
        <FormattedMessage
          id="results.popup.surveyMessage"
          defaultMessage="Help us improve MyFriendBen! Share your feedback in a quick 5-minute survey and receive a $10 Amazon gift card as a thank you."
        />
      }
      linkUrl="https://your-survey-link.com"
      linkText={<FormattedMessage id="results.popup.surveyLink" defaultMessage="Take Survey" />}
      colorTheme="blue"
      delaySeconds={5}
    />
  );
};

export default SurveyPopup;
