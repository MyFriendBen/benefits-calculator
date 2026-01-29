import { useState, useEffect } from 'react';
import './NPS.css';

type NPSFloatingProps = {
  eligibilitySnapshotId?: number;
};

const SHOW_DELAY_MS = 5000; // 5 seconds

/**
 * Floating NPS widget - appears in bottom-right corner after a delay
 */
export default function NPSFloating({ eligibilitySnapshotId }: NPSFloatingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isDismissed) {
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
        <p>How likely are you to recommend MyFriendBen to a friend?</p>
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
          <span>Not at all likely</span>
          <span>Extremely likely</span>
        </div>
      </div>
    </div>
  );
}
