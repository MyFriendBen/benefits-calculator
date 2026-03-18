import { useBenContext } from './BenContext';

export default function BenFAB() {
  const { dispatch } = useBenContext();

  return (
    <button
      className="ben-fab"
      onClick={() => dispatch({ type: 'RESTORE' })}
      aria-label="Open BenBot - Benefits Guide"
      type="button"
    >
      <span className="ben-fab__avatar" aria-hidden="true">
        B
      </span>
      <span className="ben-fab__label">Need help?</span>
    </button>
  );
}
