import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { STARTING_QUESTION_NUMBER, useStepDirectory } from '../../Assets/stepDirectory';
import { useEffect, useRef } from 'react';
import PreviousButton from '../PreviousButton/PreviousButton';
import './Confirmation.css';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import STEP_CONFIRMATIONS from './ConfirmationSteps';
import { OTHER_PAGE_TITLES } from '../../Assets/pageTitleTags';
import { usePageTitle } from '../Common/usePageTitle';
import { useTrackEvent } from '../../Assets/analytics';
import { POST_DIRECTORY_STEP_IDS } from '../../Assets/analytics/stepIds';

const CONFIRMATION_STEP_ANALYTICS_ID = POST_DIRECTORY_STEP_IDS.confirmInformation;

const Confirmation = () => {
  const { uuid, whiteLabel } = useParams();
  const navigate = useNavigate();
  const stepDirectory = useStepDirectory();
  const track = useTrackEvent();

  usePageTitle(OTHER_PAGE_TITLES.confirmation);

  // Confirmation sits after the last numbered question, so its step number is
  // the question count (the page the flow lands on after `step-${count - 1}`).
  const totalNumberOfQuestions = stepDirectory.length + STARTING_QUESTION_NUMBER;

  // This page lives outside QuestionComponentContainer (its own `confirm-information`
  // route), so — like Disclaimer — it emits its own funnel view/complete events.
  useEffect(() => {
    track('screener_form_step', {
      screener_step_name: CONFIRMATION_STEP_ANALYTICS_ID,
      screener_step_number: totalNumberOfQuestions,
      step_action: 'view',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard so holding Enter (repeated keydown before navigation unmounts) doesn't
  // emit multiple confirmation_proceed / form_complete events.
  const hasProceeded = useRef(false);
  const proceedToResults = () => {
    if (hasProceeded.current) return;
    hasProceeded.current = true;
    track('screener_form_step', {
      screener_step_name: CONFIRMATION_STEP_ANALYTICS_ID,
      screener_step_number: totalNumberOfQuestions,
      step_action: 'complete',
    });
    track('screener_confirmation_proceed', {});
    track('screener_form_complete', {});
    navigate(`/${whiteLabel}/${uuid}/results/benefits`);
  };

  useEffect(() => {
    const continueOnEnter = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        proceedToResults();
      }
    };
    document.addEventListener('keydown', continueOnEnter);
    return () => {
      document.removeEventListener('keydown', continueOnEnter); // remove event listener on onmount
    };
    // Intentionally excludes `proceedToResults`/`track`: the handler is recreated
    // whenever the listener re-binds, and depending on the route identifiers it
    // reads (navigate/whiteLabel/uuid) re-binds it exactly when its behavior
    // would change — without re-binding on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, whiteLabel, uuid]);

  const displayAllFormData = () => {
    return stepDirectory.map((step) => {
      return STEP_CONFIRMATIONS[step];
    });
  };

  return (
    <main className="benefits-form" data-step-id="confirm-information">
      <QuestionHeader>
        <FormattedMessage id="confirmation.return-subheader" defaultMessage="Is all of your information correct?" />
      </QuestionHeader>
      <div className="confirmation-container">{displayAllFormData()}</div>
      <div className="prev-continue-results-buttons confirmation">
        <PreviousButton navFunction={() => navigate(`/${whiteLabel}/${uuid}/step-${totalNumberOfQuestions - 1}`)} />
        <Button variant="contained" onClick={proceedToResults}>
          <FormattedMessage id="continueButton" defaultMessage="Continue" />
        </Button>
      </div>
    </main>
  );
};

export default Confirmation;
