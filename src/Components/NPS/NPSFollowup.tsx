import { FormattedMessage, useIntl } from 'react-intl';
import './NPS.css';

const MAX_REASON_LENGTH = 500;

type NPSFollowupProps = {
  selectedScore: number;
  reason: string;
  setReason: (reason: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  isSubmitting?: boolean;
};

/**
 * Followup textarea shown after a user selects an NPS score.
 * Used by both floating and inline variants.
 */
export default function NPSFollowup({ selectedScore, reason, setReason, onSubmit, onSkip, isSubmitting = false }: NPSFollowupProps) {
  const intl = useIntl();

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
  };

  const placeholderText = intl.formatMessage({
    id: 'nps.followup-placeholder',
    defaultMessage: 'Share your thoughts...'
  });

  return (
    <div className="nps-followup">
      <span className="nps-score-pill">
        <FormattedMessage
          id="nps.score-pill"
          defaultMessage="You selected: {score}"
          values={{ score: selectedScore }}
        />
      </span>
      <p id="nps-followup-prompt" className="nps-followup-prompt">
        <FormattedMessage
          id="nps.followup-prompt"
          defaultMessage="What's behind your score?"
        />
      </p>
      <textarea
        className="nps-followup-textarea"
        aria-labelledby="nps-followup-prompt"
        value={reason}
        onChange={handleReasonChange}
        placeholder={placeholderText}
        rows={4}
        maxLength={MAX_REASON_LENGTH}
        disabled={isSubmitting}
      />
      <div className="nps-followup-meta">
        <span className="nps-char-count">{reason.length}/{MAX_REASON_LENGTH}</span>
        <span className="nps-optional-label">
          <FormattedMessage id="nps.optional-label" defaultMessage="(optional)" />
        </span>
      </div>
      <div className="nps-followup-actions">
        <button onClick={onSkip} className="nps-skip-btn" disabled={isSubmitting}>
          <FormattedMessage id="nps.skip-button" defaultMessage="Skip" />
        </button>
        <button onClick={onSubmit} className="nps-submit-btn" disabled={isSubmitting}>
          <FormattedMessage id="nps.submit-button" defaultMessage="Submit" />
        </button>
      </div>
    </div>
  );
}
