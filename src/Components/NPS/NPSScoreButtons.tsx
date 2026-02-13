import './NPS.css';

const NPS_SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type NPSScoreButtonsProps = {
  selectedScore: number | null;
  onScoreClick: (score: number) => void;
};

/**
 * Reusable NPS score button row (1-10) with labels.
 */
export default function NPSScoreButtons({ selectedScore, onScoreClick }: NPSScoreButtonsProps) {
  return (
    <>
      <div className="nps-score-buttons">
        {NPS_SCORES.map((score) => (
          <button
            key={score}
            onClick={() => onScoreClick(score)}
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
    </>
  );
}
