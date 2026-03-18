import { useBenContext } from '../BenContext';
import BenChatBubble from '../BenChatBubble';
import BenQuickReply from '../BenQuickReply';

export default function PrioritizationSelect() {
  const { filteredPrograms, dispatch } = useBenContext();

  const count = filteredPrograms.length;
  const benText = `Nice -- you have ${count} new programs to explore. How would you like to see them?`;

  return (
    <div className="ben-step">
      <BenChatBubble>
        <p>
          Nice -- you have <strong>{count} programs</strong> to explore. How would you like to see them?
        </p>
      </BenChatBubble>
      <div className="ben-quick-reply-column">
        <BenQuickReply
          label="Highest value first"
          onClick={() =>
            dispatch({ type: 'SELECT_LENS', lens: 'highest_value', benText, userText: 'Highest value first' })
          }
        />
        <BenQuickReply
          label="Quickest to apply for"
          onClick={() =>
            dispatch({ type: 'SELECT_LENS', lens: 'quickest_apply', benText, userText: 'Quickest to apply for' })
          }
        />
        <BenQuickReply
          label="Most likely eligible for"
          onClick={() =>
            dispatch({ type: 'SELECT_LENS', lens: 'most_likely', benText, userText: 'Most likely eligible for' })
          }
        />
        <BenQuickReply
          label="Quickest to receive"
          onClick={() =>
            dispatch({ type: 'SELECT_LENS', lens: 'quickest_receive', benText, userText: 'Quickest to receive' })
          }
        />
        <BenQuickReply
          label="I'll browse on my own"
          variant="secondary"
          onClick={() => dispatch({ type: 'SKIP', benText, userText: "I'll browse on my own" })}
        />
      </div>
    </div>
  );
}
