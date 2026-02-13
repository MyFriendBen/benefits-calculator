import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNPSState } from './useNPSState';
import NPSScoreButtons from './NPSScoreButtons';
import NPSFollowup from './NPSFollowup';
import './NPS.css';

type NPSFloatingProps = {
  uuid?: string;
};

const SHOW_DELAY_MS = 5000; // 5 seconds

/**
 * Floating NPS widget - appears in bottom-right corner after a delay
 */
export default function NPSFloating({ uuid }: NPSFloatingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { selectedScore, isScoreSubmitted, isFullySubmitted, isSubmitting, reason, setReason, submitScore, submitReason, skipReason } =
    useNPSState('floating', uuid);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="nps-floating">
      {!isFullySubmitted && (
        <button onClick={() => setIsDismissed(true)} className="nps-dismiss-btn" aria-label="Dismiss">
          &times;
        </button>
      )}
      <div className="nps-floating-content">
        {isFullySubmitted ? (
          <>
            <p>
              <FormattedMessage id="nps.thank-you" defaultMessage="Thank you for your feedback!" />
            </p>
            <button onClick={() => setIsDismissed(true)} className="nps-close-btn">
              <FormattedMessage id="nps.close-button" defaultMessage="Close" />
            </button>
          </>
        ) : isScoreSubmitted ? (
          <NPSFollowup selectedScore={selectedScore!} reason={reason} setReason={setReason} onSubmit={submitReason} onSkip={skipReason} isSubmitting={isSubmitting} />
        ) : (
          <>
            <p>
              <FormattedMessage id="nps.prompt" defaultMessage="How likely are you to recommend MyFriendBen to a friend?" />
            </p>
            <NPSScoreButtons selectedScore={selectedScore} onScoreClick={submitScore} />
          </>
        )}
      </div>
    </div>
  );
}
