import { FormattedMessage, useIntl } from 'react-intl';
import { Box, IconButton } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { calcAge } from '../../../../Assets/age';
import { useConfig } from '../../../Config/configHook';
import { useTranslateNumber } from '../../../../Assets/languageOptions';
import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType, QuestionName } from '../../../../Types/Questions';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyboardEvent, MouseEvent, useContext, useState } from 'react';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { Context } from '../../../Wrapper/Wrapper';
import useScreenApi from '../../../../Assets/updateScreen';
import '../styles/HouseholdMemberSummaryCards.css';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { formatToUSD } from '../../../../utils/formatCurrency';
import DeleteConfirmationPopover from './DeleteConfirmationPopover';
import type { DeletePopoverState } from '../utils/types';

type HHMSummariesProps = {
  questionName: QuestionName;
};

// A member's card is "completed" once they have basic info (birth date + relationship)
// and have answered the health insurance question. This is the single source of truth
// for whether a card shows income, gets the completed badge, and is clickable to edit.
const isMemberCompleted = (member: HouseholdData | undefined): member is HouseholdData => {
  if (!member) {
    return false;
  }
  const hasAnsweredInsurance = Boolean(
    member.healthInsurance && Object.values(member.healthInsurance).some((value) => value === true),
  );
  return Boolean(member.birthYear && member.birthMonth && member.relationshipToHH && hasAnsweredInsurance);
};

const HouseholdMemberSummaryCards = ({ questionName }: HHMSummariesProps) => {
  const { formData, whiteLabel } = useContext(Context);
  const { uuid, page } = useParams();
  const pageNumber = Number(page);
  const currentStepId = useStepNumber(questionName);
  const relationshipOptions = useConfig<{ [key: string]: FormattedMessageType }>('relationship_options');
  // Render the roster whenever there's at least one member slot to show — either real data has
  // been entered, or we're on the current member's own page (so they see their card in progress).
  const hasMembersToShow = formData.householdData.length >= 1 || pageNumber >= 1;
  const translateNumber = useTranslateNumber();
  const intl = useIntl();
  const editHHMemberAriaLabel = intl.formatMessage({
    id: 'editHHMember.ariaText',
    defaultMessage: 'edit household member',
  });
  const deleteHHMemberAriaLabel = intl.formatMessage({
    id: 'deleteHHMember.ariaText',
    defaultMessage: 'delete household member',
  });
  const navigate = useNavigate();
  const { updateScreen } = useScreenApi();

  // The delete confirmation popover is anchored to the trash button that opened it.
  const [deletePopover, setDeletePopover] = useState<DeletePopoverState>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Navigate straight to the member's page without re-validating — validation runs when
  // they submit that member's form. `returnToPage` lets the form send the user back here.
  const goToMember = (memberIndex: number) => {
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${memberIndex + 1}`, {
      state: { isEditing: true, returnToPage: pageNumber },
    });
  };

  // Persist the deletion, then keep the user on a valid page. Deleting a member shifts every
  // later member's index down by one, so page numbers after the deleted slot change.
  const handleDeleteConfirm = async () => {
    if (deletePopover === null || !uuid) {
      return;
    }
    const deletedIndex = deletePopover.index;
    setIsDeleting(true);
    try {
      const updatedHouseholdData = formData.householdData.filter((_, i) => i !== deletedIndex);
      await updateScreen({
        ...formData,
        householdSize: updatedHouseholdData.length,
        householdData: updatedHouseholdData,
      });

      const deletedPage = deletedIndex + 1;
      if (deletedPage === pageNumber) {
        // We deleted the member whose page we're on — that page no longer exists. Send the
        // user back to the basic-info roster (page 0), the safe page that lists everyone.
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/0`);
      } else if (deletedPage < pageNumber) {
        // A member before us was removed, so our member now lives one page earlier.
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`);
      }
      // If the deleted member was after the current page, our page number is unchanged and the
      // updated context re-renders the roster in place — no navigation needed.
    } finally {
      setIsDeleting(false);
      setDeletePopover(null);
    }
  };

  const createMemberCard = (memberIndex: number, member: HouseholdData | undefined) => {
    const isCurrentMember = memberIndex + 1 === pageNumber;
    const isCompleted = isMemberCompleted(member);
    // Only completed, non-current cards are editable: the current member is being entered
    // right now, and incomplete members have nothing to edit yet.
    const isEditable = isCompleted && !isCurrentMember;
    // Any entered member can be deleted (even an incomplete one), except the head of household
    // (index 0) — removing "Yourself" isn't supported here, matching the basic-info page.
    const canDelete = Boolean(member) && memberIndex !== 0;

    // Show the age only once a real birthdate exists; an in-progress member (e.g. member 1
    // mid-entry) shows their relationship label with no "(0)" until they've filled it in.
    const hasBirthdate = Boolean(member?.birthYear && member?.birthMonth);
    let age = hasBirthdate ? calcAge(member as HouseholdData) : null;
    if (age !== null && Number.isNaN(age)) {
      age = null;
    }
    // Show income for any completed member, including the current one when editing — a member
    // is only "completed" once real data was submitted, so a fresh in-progress member (e.g.
    // member 1 mid-entry) is never completed and won't show a premature "Income: $0".
    const income = isCompleted ? calcMemberYearlyIncome(member) : null;

    const placeholderRelationship = (
      <FormattedMessage id="householdDataBlock.householdMember" defaultMessage="Household Member" />
    );
    let relationship: FormattedMessageType;
    if (memberIndex === 0) {
      relationship = <FormattedMessage id="relationshipOptions.yourself" defaultMessage="Yourself" />;
    } else if (member) {
      // Fall back to the generic label if the config has no entry for this relationship value.
      relationship = relationshipOptions[member.relationshipToHH] ?? placeholderRelationship;
    } else {
      relationship = placeholderRelationship;
    }

    const containerClassName = `member-added-container ${isCompleted ? 'completed-household-member' : ''} ${
      isCurrentMember ? 'current-household-member' : ''
    }`;

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goToMember(memberIndex);
      }
    };

    const handleDeleteClick = (event: MouseEvent<HTMLElement>) => {
      // The trash button lives inside the (clickable) card — keep its click from bubbling up
      // and triggering the card's edit navigation.
      event.stopPropagation();
      setDeletePopover({ index: memberIndex, anchorEl: event.currentTarget });
    };

    return (
      <article
        className={containerClassName}
        key={memberIndex}
        onClick={isEditable ? () => goToMember(memberIndex) : undefined}
        onKeyDown={isEditable ? handleKeyDown : undefined}
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable ? 0 : undefined}
        aria-label={isEditable ? editHHMemberAriaLabel : undefined}
      >
        {isCurrentMember && (
          <div className="household-member-status-icon">
            <ConstructionIcon className="current-icon" aria-hidden="true" />
          </div>
        )}
        {isEditable && (
          <div className="household-member-status-icon">
            <CheckCircleIcon className="completed-icon" aria-hidden="true" />
          </div>
        )}
        <div className="household-member-header">
          <h3 className="member-added-relationship">
            {relationship}
            {age !== null && <> ({translateNumber(age)})</>}
          </h3>
          {canDelete && (
            <IconButton
              className="household-member-delete-button"
              size="small"
              aria-label={deleteHHMemberAriaLabel}
              onClick={handleDeleteClick}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </div>
        {income !== null && (
          <div className="member-added-income">
            <strong>
              <FormattedMessage id="householdDataBlock.member-income" defaultMessage="Annual Income: " />
            </strong>
            {translateNumber(formatToUSD(income))}
          </div>
        )}
      </article>
    );
  };

  // Render one card per household slot — completed members show their data, the rest are placeholders.
  // Guard the slot count: clamp to a sane integer and never render fewer slots than members we
  // already have, so a stale/malformed householdSize can't hide already-entered members.
  const rawSlotCount = Number(formData.householdSize);
  const slotCount = Number.isFinite(rawSlotCount)
    ? Math.max(0, Math.floor(rawSlotCount), formData.householdData.length)
    : formData.householdData.length;
  const allMemberCards = Array.from({ length: slotCount }, (_, i) => createMemberCard(i, formData.householdData[i]));

  return (
    <article key={pageNumber}>
      {/*
        The current member's own (incomplete) card suppresses its age until a birthdate exists,
        so showing the roster on the member-1 page no longer renders a misleading (0)-age card.
      */}
      {hasMembersToShow && (
        <Box sx={{ marginBottom: '0.5rem' }}>
          <div className="household-members-grid">{allMemberCards}</div>
        </Box>
      )}

      <DeleteConfirmationPopover
        deletePopover={deletePopover}
        isDeleting={isDeleting}
        onClose={() => setDeletePopover(null)}
        onConfirm={handleDeleteConfirm}
      />
    </article>
  );
};

export default HouseholdMemberSummaryCards;
