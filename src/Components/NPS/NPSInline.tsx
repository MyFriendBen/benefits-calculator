import { useState } from 'react';
import './NPS.css';

type NPSInlineProps = {
  eligibilitySnapshotId?: number;
};

/**
 * Inline NPS section - full-width section at bottom of results page
 * TODO: Replace placeholder with actual design
 */
export default function NPSInline({ eligibilitySnapshotId }: NPSInlineProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleScoreClick = (score: number) => {
    setSelectedScore(score);
    // TODO: Submit to API
    console.log('NPS Score submitted:', { score, variant: 'inline', eligibilitySnapshotId });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="nps-inline">
        <p className="nps-thank-you">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="nps-inline">
      <h3 className="nps-inline-title">How likely are you to recommend MyFriendBen to a friend?</h3>
      <p className="nps-inline-subtitle">Your feedback helps us improve and reach more people in need</p>
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
  );
}
