import { FormattedMessage, useIntl } from 'react-intl';
import { Box } from '@mui/material';
import { useConfig } from '../../../Config/configHook';
import { useTranslateNumber } from '../../../../Assets/languageOptions';
import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType, QuestionName } from '../../../../Types/Questions';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useRef, useState } from 'react';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { Context } from '../../../Wrapper/Wrapper';
import useScreenApi from '../../../../Assets/updateScreen';
import '../styles/HouseholdMemberSummaryCards.css';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { formatToUSD } from '../../../../utils/formatCurrency';
import { calculateAge } from '../utils/helpers';
import { hasSubmittedMemberForm } from '../utils/defaultValues';
import DeleteConfirmationPopover from './DeleteConfirmationPopover';
import MemberCard from './MemberCard';
import type { DeletePopoverState, LocationState } from '../utils/types';
import { useTrackEvent } from '../../../../Assets/analytics';
import { getStepAnalyticsId } from '../../../../Assets/analytics/stepIds';

type HHMSummariesProps = {
  questionName: QuestionName;
};

// A member's card is "completed" once they have basic info (birth date + relationship) and have
// successfully submitted their detail form (hit "Continue"). We detect the submit via the shared,
// workflow-agnostic `hasSubmittedMemberForm` rather than enumerating per-flow fields here — that's
// the single source of truth across the main and energy-calculator (CESN) flows.
const isMemberCompleted = (member: HouseholdData | undefined): member is HouseholdData => {
  if (!member) {
    return false;
  }
  const hasBasicInfo = Boolean(member.birthYear && member.birthMonth && member.relationshipToHH);
  return hasBasicInfo && hasSubmittedMemberForm(member);
};

const HouseholdMemberSummaryCards = ({ questionName }: HHMSummariesProps) => {
  const { formData, whiteLabel } = useContext(Context);
  const { uuid, page } = useParams();
  const location = useLocation();
  // Edit context from the card that opened this member, preserved across deletions below.
  const locationState = location.state as LocationState | null;
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
  // Navigation away can unmount this component before an in-flight delete settles; the ref
  // lets the `finally` block skip state updates on an unmounted component.
  const isMountedRef = useRef(true);
  const track = useTrackEvent();
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Navigate straight to the member's page without re-validating — validation runs when
  // they submit that member's form. `returnToPage` lets the form send the user back here.
  const goToMember = (memberIndex: number) => {
    track('screener_household_member', {
      screener_step_name: getStepAnalyticsId(questionName),
      screener_step_number: currentStepId,
      action: 'edit_from_summary',
    });
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
      // Decrement the declared household size rather than setting it to the number of entered
      // members: the roster shows a deletable card for every slot, including ones not filled in
      // yet, so `updatedHouseholdData.length` would silently discard those remaining slots.
      const previousSize = Number(formData.householdSize);
      const updatedHouseholdSize = Number.isFinite(previousSize)
        ? Math.max(updatedHouseholdData.length, previousSize - 1)
        : updatedHouseholdData.length;

      await updateScreen({
        ...formData,
        householdSize: updatedHouseholdSize,
        householdData: updatedHouseholdData,
      });
      // Distinct from the basics-roster 'delete': this removes an already-detailed
      // member from the summary cards, which is a different user behavior.
      track('screener_household_member', {
        screener_step_name: getStepAnalyticsId(questionName),
        screener_step_number: currentStepId,
        action: 'delete_from_summary',
      });

      const deletedPage = deletedIndex + 1;
      if (deletedPage === pageNumber) {
        // We deleted the member whose page we're on — that page no longer exists. Send the
        // user back to the basic-info roster (page 0), the safe page that lists everyone.
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/0`);
      } else if (deletedPage < pageNumber) {
        // A member before us was removed, so our member now lives one page earlier. Carry the
        // edit state forward or Continue abandons the card that opened this edit and resumes
        // normal next-member navigation. The return target shifts only if it sat after the
        // deleted page; a target before it is unaffected.
        const editState =
          locationState?.isEditing && locationState?.returnToPage !== undefined
            ? {
                isEditing: true,
                returnToPage:
                  deletedPage < locationState.returnToPage
                    ? locationState.returnToPage - 1
                    : locationState.returnToPage,
              }
            : {};

        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`, {
          state: { basicInfoCollected: true, ...editState },
        });
      }
      // If the deleted member was after the current page, our page number is unchanged and the
      // updated context re-renders the roster in place — no navigation needed.
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
        setDeletePopover(null);
      }
    }
  };

  const handleDelete = (memberIndex: number, anchorEl: HTMLElement) => {
    setDeletePopover({ index: memberIndex, anchorEl });
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
    // calculateAge is the shared null-safe wrapper used by the form header, so both agree on
    // missing/invalid birthdates (it returns null rather than a misleading 0).
    const rawAge = member ? calculateAge(member.birthYear, member.birthMonth) : null;
    const age = rawAge !== null && !Number.isNaN(rawAge) ? translateNumber(rawAge) : null;

    // Show income for any completed member, including the current one when editing — a member
    // is only "completed" once real data was submitted, so a fresh in-progress member (e.g.
    // member 1 mid-entry) is never completed and won't show a premature "Income: $0".
    const income = isCompleted ? translateNumber(formatToUSD(calcMemberYearlyIncome(member))) : null;

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

    return (
      <MemberCard
        key={memberIndex}
        memberIndex={memberIndex}
        relationship={relationship}
        age={age}
        income={income}
        isCurrentMember={isCurrentMember}
        isCompleted={isCompleted}
        isEditable={isEditable}
        canDelete={canDelete}
        editAriaLabel={editHHMemberAriaLabel}
        deleteAriaLabel={deleteHHMemberAriaLabel}
        onEdit={goToMember}
        onDelete={handleDelete}
      />
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
    // Keyed by pageNumber so navigating between member pages remounts the roster, resetting any
    // transient card state (e.g. an open delete popover) for the page we're leaving. This is a
    // plain container (not an <article>) — each member card is its own <article>.
    <div key={pageNumber}>
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
    </div>
  );
};

export default HouseholdMemberSummaryCards;
