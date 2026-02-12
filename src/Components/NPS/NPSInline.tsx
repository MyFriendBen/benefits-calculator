import { useNPSState } from './useNPSState';
import NPSScoreButtons from './NPSScoreButtons';
import NPSFollowup from './NPSFollowup';
import './NPS.css';

type NPSInlineProps = {
  uuid?: string;
};

/**
 * Inline NPS section - full-width section at bottom of results page
 */
export default function NPSInline({ uuid }: NPSInlineProps) {
  const { selectedScore, isScoreSubmitted, isFullySubmitted, reason, setReason, submitScore, submitReason, skipReason } =
    useNPSState('inline', uuid);

  if (isFullySubmitted) {
    return (
      <div className="nps-inline">
        <p className="nps-thank-you">Thank you for your feedback!</p>
      </div>
    );
  }

  if (isScoreSubmitted) {
    return (
      <div className="nps-inline">
        <NPSFollowup reason={reason} setReason={setReason} onSubmit={submitReason} onSkip={skipReason} />
      </div>
    );
  }

  return (
    <div className="nps-inline">
      <h3 className="nps-inline-title">How likely are you to recommend MyFriendBen to a friend?</h3>
      <NPSScoreButtons selectedScore={selectedScore} onScoreClick={submitScore} />
    </div>
  );
}
