import { useBenContext } from '../BenContext';
import BenChatBubble from '../BenChatBubble';
import BenQuickReply from '../BenQuickReply';

export default function ConfirmHide() {
  const { filteredPrograms, state, dispatch } = useBenContext();

  const count = filteredPrograms.length;
  const hasAlreadyHave = state.alreadyHaveProgramIds.length > 0;

  const benText = hasAlreadyHave
    ? `Nice, you have ${count} new programs to explore. Would you like to hide the benefits you already receive?`
    : `Nice, you have ${count} new programs to explore. Are there any programs you'd like to hide?`;

  if (!hasAlreadyHave) {
    // No programs marked as already have — skip straight to hide others
    return (
      <div className="ben-step">
        <BenChatBubble>
          <p>
            Nice, you have <strong>{count} new programs</strong> to explore. Are there any you&apos;d like to hide?
          </p>
        </BenChatBubble>
        <div className="ben-quick-reply-row">
          <BenQuickReply
            label="Yes"
            onClick={() => dispatch({ type: 'CONFIRM_HIDE_ALREADY_HAVE', benText, userText: 'Yes' })}
          />
          <BenQuickReply
            label="No, show me everything"
            variant="secondary"
            onClick={() => dispatch({ type: 'SKIP', benText, userText: 'No, show me everything' })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ben-step">
      <BenChatBubble>
        <p>
          Nice, you have <strong>{count} new programs</strong> to explore. Would you like to hide the benefits you
          already receive?
        </p>
      </BenChatBubble>
      <div className="ben-quick-reply-row">
        <BenQuickReply
          label="Yes, hide them"
          onClick={() => dispatch({ type: 'CONFIRM_HIDE_ALREADY_HAVE', benText, userText: 'Yes, hide them' })}
        />
        <BenQuickReply
          label="No, keep them visible"
          variant="secondary"
          onClick={() => {
            dispatch({ type: 'CONFIRM_HIDE_ALREADY_HAVE', benText, userText: 'No, keep them visible' });
          }}
        />
      </div>
    </div>
  );
}
