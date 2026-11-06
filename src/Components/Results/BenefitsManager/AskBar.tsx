import { useEffect, useRef, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

type AskBarProps = {
  /** Produces the answer to show. Demo-only: canned, nothing leaves the browser. */
  answer: (question: string) => string;
};

type Exchange = { question: string; answer: string | null };

const AskBar = ({ answer }: AskBarProps) => {
  const [question, setQuestion] = useState('');
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const ask = () => {
    const asked = question.trim();
    if (asked === '') return;
    setExchange({ question: asked, answer: null });
    setQuestion('');
    // A short pause so the answer doesn't appear before the eye has left the button.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setExchange({ question: asked, answer: answer(asked) }), 600);
  };

  return (
    <div className="bm-ask">
      <form
        className="bm-ask-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <SearchIcon className="bm-ask-icon" aria-hidden="true" />
        <input
          type="text"
          aria-label="Ask a question about your benefits"
          placeholder='Ask a question — "Will SNAP change if I pick up more hours?"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="bm-ask-btn" disabled={question.trim() === ''}>
          Ask
        </button>
      </form>
      {exchange && (
        <div className="bm-ask-answer" aria-live="polite">
          <button
            type="button"
            className="bm-icon-btn bm-ask-close"
            aria-label="Close answer"
            onClick={() => setExchange(null)}
          >
            <CloseIcon fontSize="small" />
          </button>
          <p className="bm-ask-question">{exchange.question}</p>
          <p className="bm-ask-text">{exchange.answer ?? 'Looking at your benefits…'}</p>
        </div>
      )}
    </div>
  );
};

export default AskBar;
