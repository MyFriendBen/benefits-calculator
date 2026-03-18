import { useBenContext } from '../BenContext';
import BenChatBubble from '../BenChatBubble';
import BenQuickReply from '../BenQuickReply';
import BenProgramChip from '../BenProgramChip';

export default function HideOthers() {
  const { filteredPrograms, state, dispatch } = useBenContext();

  const benText =
    "Are there any other programs you'd like to hide from your list? You can always bring them back later.";

  function getUserText(): string {
    const selected = filteredPrograms
      .filter((p) => state.pendingNotInterestedIds.includes(p.program_id))
      .map((p) => p.name.default_message);
    if (selected.length > 0) {
      return `Hide: ${selected.join(', ')}`;
    }
    return 'No thanks';
  }

  const hasSelections = state.pendingNotInterestedIds.length > 0;

  return (
    <div className="ben-step">
      <BenChatBubble>
        <p>
          Are there any other programs you&apos;d like to hide from your list? You can always bring them back later.
        </p>
      </BenChatBubble>
      <div className="ben-program-chip-list">
        {filteredPrograms.map((program) => (
          <BenProgramChip
            key={program.program_id}
            label={program.name.default_message}
            selected={state.pendingNotInterestedIds.includes(program.program_id)}
            onClick={() => dispatch({ type: 'TOGGLE_NOT_INTERESTED', programId: program.program_id })}
          />
        ))}
      </div>
      <div className="ben-quick-reply-row">
        <BenQuickReply
          label={hasSelections ? 'Hide selected' : 'No thanks'}
          onClick={() => dispatch({ type: 'CONFIRM_HIDE_OTHERS', benText, userText: getUserText() })}
        />
      </div>
    </div>
  );
}
