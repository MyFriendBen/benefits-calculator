import { useState } from 'react';
import './NPS.css';

type NPSFloatingProps = {
  eligibilitySnapshotId?: number;
};

/**
 * Floating NPS widget - appears in bottom-right corner
 * TODO: Replace placeholder with actual design
 */
export default function NPSFloating({ eligibilitySnapshotId }: NPSFloatingProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleScoreClick = (score: number) => {
    setSelectedScore(score);
    // TODO: Submit to API
    console.log('NPS Score submitted:', { score, variant: 'floating', eligibilitySnapshotId });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="nps-floating">
        <div className="nps-floating-content">
          <p>Thank you for your feedback!</p>
          <button onClick={() => setIsDismissed(true)} className="nps-close-btn">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nps-floating">
      <div className="nps-floating-header">
        <span>Quick Feedback</span>
        <button onClick={() => setIsDismissed(true)} className="nps-dismiss-btn" aria-label="Dismiss">
          ×
        </button>
      </div>
      <div className="nps-floating-content">
        <p>How likely would you recommend us?</p>
        <div className="nps-score-buttons">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              onClick={() => handleScoreClick(score)}
              className={`nps-score-btn ${selectedScore === score ? 'selected' : ''}`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="nps-labels">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>
    </div>
  );
}
