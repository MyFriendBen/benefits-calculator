import { useResultsContext } from '../../Results';
import { useBenContext } from '../BenContext';
import BenChatBubble from '../BenChatBubble';
import BenQuickReply from '../BenQuickReply';
import BenProgramChip from '../BenProgramChip';

export default function AlreadyHaveFilter() {
  const { programCategories } = useResultsContext();
  const { state, dispatch } = useBenContext();

  const nonEmptyCategories = programCategories.filter((cat) => cat.programs.length > 0);
  const totalCategories = nonEmptyCategories.length;
  const currentCategory = nonEmptyCategories[state.categoryIndex];

  if (!currentCategory) {
    return null;
  }

  const categoryName = currentCategory.name.default_message;
  const isFirst = state.categoryIndex === 0;
  const isLast = state.categoryIndex === totalCategories - 1;

  const currentCategoryProgramIds = currentCategory.programs.map((p) => p.program_id);
  const hasSelectionsInCategory = state.pendingAlreadyHaveIds.some((id) => currentCategoryProgramIds.includes(id));

  const benText = isFirst
    ? `Do you already receive any of these ${categoryName} benefits?`
    : `How about ${categoryName}? Do you already have any of these?`;

  function getUserText(): string {
    const selectedInCategory = currentCategory.programs
      .filter((p) => state.pendingAlreadyHaveIds.includes(p.program_id))
      .map((p) => p.name.default_message);
    if (selectedInCategory.length > 0) {
      return `I have: ${selectedInCategory.join(', ')}`;
    }
    return 'None of these';
  }

  return (
    <div className="ben-step">
      <BenChatBubble>
        {isFirst ? (
          <p>
            Do you already receive any of these <strong>{categoryName}</strong> benefits? Tap any you currently have.
          </p>
        ) : (
          <p>
            How about <strong>{categoryName}</strong>? Do you already have any of these?
          </p>
        )}
      </BenChatBubble>
      <div className="ben-program-chip-list">
        {currentCategory.programs.map((program) => (
          <BenProgramChip
            key={program.program_id}
            label={program.name.default_message}
            selected={state.pendingAlreadyHaveIds.includes(program.program_id)}
            onClick={() => dispatch({ type: 'TOGGLE_PENDING_PROGRAM', programId: program.program_id })}
          />
        ))}
      </div>
      <div className="ben-quick-reply-row">
        <BenQuickReply
          label={hasSelectionsInCategory ? (isLast ? 'Done' : 'Next') : isLast ? 'None of these' : 'Next'}
          onClick={() => dispatch({ type: 'NEXT_CATEGORY', totalCategories, benText, userText: getUserText() })}
        />
        <BenQuickReply
          label="Skip all"
          variant="secondary"
          onClick={() => dispatch({ type: 'SKIP_ALL_CATEGORIES', benText, userText: 'Skip all' })}
        />
      </div>
      <div className="ben-category-progress">
        {state.categoryIndex + 1} of {totalCategories}
      </div>
    </div>
  );
}
