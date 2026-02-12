import './NPS.css';

type NPSFollowupProps = {
  reason: string;
  setReason: (reason: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
};

/**
 * Followup textarea shown after a user selects an NPS score.
 * Used by both floating and inline variants.
 */
export default function NPSFollowup({ reason, setReason, onSubmit, onSkip }: NPSFollowupProps) {
  return (
    <div className="nps-followup">
      <p className="nps-followup-prompt">What is the main reason for your score?</p>
      <textarea
        className="nps-followup-textarea"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Tell us more (optional)"
        rows={3}
      />
      <div className="nps-followup-actions">
        <button onClick={onSubmit} className="nps-submit-btn">
          Submit
        </button>
        <button onClick={onSkip} className="nps-skip-btn">
          Skip
        </button>
      </div>
    </div>
  );
}
