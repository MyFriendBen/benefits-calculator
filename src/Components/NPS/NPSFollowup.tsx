import './NPS.css';

const MAX_REASON_LENGTH = 500;

type NPSFollowupProps = {
  selectedScore: number;
  reason: string;
  setReason: (reason: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
};

function getPromptForScore(score: number): string {
  if (score >= 9) return 'What did we do well?';
  if (score >= 7) return 'What could we improve?';
  return 'What disappointed you?';
}

/**
 * Followup textarea shown after a user selects an NPS score.
 * Used by both floating and inline variants.
 */
export default function NPSFollowup({ selectedScore, reason, setReason, onSubmit, onSkip }: NPSFollowupProps) {
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_REASON_LENGTH) {
      setReason(value);
    }
  };

  return (
    <div className="nps-followup">
      <span className="nps-score-pill">You selected: {selectedScore}</span>
      <p className="nps-followup-prompt">{getPromptForScore(selectedScore)}</p>
      <textarea
        className="nps-followup-textarea"
        value={reason}
        onChange={handleReasonChange}
        placeholder="(optional) Share your thoughts..."
        rows={4}
        maxLength={MAX_REASON_LENGTH}
      />
      <div className="nps-followup-meta">
        <span className="nps-char-count">{reason.length}/{MAX_REASON_LENGTH}</span>
        <span className="nps-optional-label">(optional)</span>
      </div>
      <div className="nps-followup-actions">
        <button onClick={onSkip} className="nps-skip-btn">
          Skip
        </button>
        <button onClick={onSubmit} className="nps-submit-btn">
          Submit
        </button>
      </div>
    </div>
  );
}
