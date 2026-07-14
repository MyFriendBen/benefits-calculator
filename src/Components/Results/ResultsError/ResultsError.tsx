import { useEffect } from 'react';
import { Button } from '@mui/material';
import { Icon } from '../../Icon/Icon';
import { useParams, useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import './ResultsError.css';
import { useConfig } from '../../Config/configHook';
import { useTrackEvent } from '../../../Assets/analytics';

const ResultsError = () => {
  const { uuid, whiteLabel } = useParams();
  const { email } = useConfig<{ email: string; survey: string }>('feedback_links');
  const navigate = useNavigate();
  const track = useTrackEvent();

  useEffect(() => {
    track('screener_results_error', { reference_id: uuid });
    // Fire once on mount: this error event should count one impression per
    // error-screen view, so `track`/`uuid` are intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="benefits-form">
      <div className="error-container">
        <Icon name="circle-alert" className="error-icon" />
        <h1 className="error-header">
          <FormattedMessage id="results-error.header" defaultMessage="Oops! Looks like something went wrong." />
        </h1>
        <p className="error-message">
          <FormattedMessage
            id="results-error.message"
            defaultMessage="We're sorry. We are having some trouble completing your request. Please make sure you have completed all of the questions on the screen and try again. If you are still unable to load your benefits results, please contact "
          />
          {email}
        </p>
        <p className="error-uuid">
          <FormattedMessage id="results-error.uuid" defaultMessage="Reference ID: " />
          {uuid}
        </p>
        <Button
          className="error-button"
          onClick={() => {
            track('screener_results_error_recovery', {});
            navigate(`/${whiteLabel}/${uuid}/confirm-information`);
          }}
          variant="contained"
        >
          <FormattedMessage id="results-error.button" defaultMessage="Back to Screener" />
        </Button>
      </div>
    </main>
  );
};

export default ResultsError;
