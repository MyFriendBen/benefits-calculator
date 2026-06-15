import { FormattedMessage } from 'react-intl';
import { IconButton } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { KeyboardEvent, MouseEvent } from 'react';
import { FormattedMessageType } from '../../../../Types/Questions';

type MemberCardProps = {
  memberIndex: number;
  relationship: FormattedMessageType;
  /** Member's current age, or null to suppress the "(age)" parenthetical (no/invalid birthdate). */
  age: string | null;
  /** Formatted annual income string, or null to hide the income row. */
  income: string | null;
  isCurrentMember: boolean;
  isCompleted: boolean;
  /** Completed, non-current cards are clickable to edit; the current and incomplete cards are not. */
  isEditable: boolean;
  canDelete: boolean;
  editAriaLabel: string;
  deleteAriaLabel: string;
  onEdit: (memberIndex: number) => void;
  onDelete: (memberIndex: number, anchorEl: HTMLElement) => void;
};

/**
 * A single household-member summary card. Renders one of three visual states — current (being
 * edited now), completed (editable), or placeholder/incomplete — driven entirely by props so the
 * parent owns all the slot/completion logic and this stays a pure presentational component.
 */
const MemberCard = ({
  memberIndex,
  relationship,
  age,
  income,
  isCurrentMember,
  isCompleted,
  isEditable,
  canDelete,
  editAriaLabel,
  deleteAriaLabel,
  onEdit,
  onDelete,
}: MemberCardProps) => {
  const containerClassName = `member-added-container ${isCompleted ? 'completed-household-member' : ''} ${
    isCurrentMember ? 'current-household-member' : ''
  }`;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEdit(memberIndex);
    }
  };

  const handleDeleteClick = (event: MouseEvent<HTMLElement>) => {
    // The trash button is a sibling of the edit button (not nested in it), so the edit click
    // can't fire from a trash click — but stop propagation anyway as a defensive guard.
    event.stopPropagation();
    onDelete(memberIndex, event.currentTarget);
  };

  // The current and completed states are mutually exclusive (a card can't be both being-edited
  // and editable-elsewhere), so a single badge slot picks the right icon rather than rendering two
  // absolutely-positioned badges that would otherwise stack at the same coordinates.
  let statusIcon: JSX.Element | null = null;
  if (isCurrentMember) {
    statusIcon = <ConstructionIcon className="current-icon" aria-hidden="true" />;
  } else if (isEditable) {
    statusIcon = <CheckCircleIcon className="completed-icon" aria-hidden="true" />;
  }

  const relationshipLabel = (
    <h3 className="member-added-relationship">
      {relationship}
      {age !== null && (
        <>
          {' '}
          {/* A FormattedMessage so the parens are localizable/RTL-aware rather than hardcoded. */}
          <FormattedMessage id="householdDataBlock.memberAgeParenthetical" defaultMessage="({age})" values={{ age }} />
        </>
      )}
    </h3>
  );

  return (
    <article className={containerClassName}>
      {statusIcon !== null && <div className="household-member-status-icon">{statusIcon}</div>}
      <div className="household-member-header">
        {/*
          The clickable surface is a real <button> rather than an <article role="button"> so the
          trash IconButton isn't an interactive element nested inside another interactive element
          (invalid ARIA). Non-editable cards render the label as plain text with no button.
        */}
        {isEditable ? (
          <button
            type="button"
            className="member-added-edit-button"
            onClick={() => onEdit(memberIndex)}
            onKeyDown={handleKeyDown}
            aria-label={editAriaLabel}
          >
            {relationshipLabel}
          </button>
        ) : (
          relationshipLabel
        )}
        {canDelete && (
          <IconButton
            className="household-member-delete-button"
            size="small"
            aria-label={deleteAriaLabel}
            onClick={handleDeleteClick}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </div>
      {income !== null && (
        // Income is hidden on mobile via the `.member-added-income` rule in
        // HouseholdMemberSummaryCards.css (max-width: 600px) to keep the roster compact there.
        <div className="member-added-income">
          <strong>
            <FormattedMessage id="householdDataBlock.member-income" defaultMessage="Annual Income: " />
          </strong>
          {income}
        </div>
      )}
    </article>
  );
};

export default MemberCard;
