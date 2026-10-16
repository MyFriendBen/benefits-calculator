import { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFieldArray, SubmitHandler } from 'react-hook-form';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { mfbZodResolver } from '../../../../Assets/analytics/mfbZodResolver';
import { Context } from '../../../Wrapper/Wrapper';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import useScreenApi from '../../../../Assets/updateScreen';
import useStepForm from '../../stepForm';
import { FormattedMessageType } from '../../../../Types/Questions';
import { useConfig } from '../../../Config/configHook';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { Icon } from '../../../Icon/Icon';
import { BASIC_INFO_GRID_STYLES } from '../utils/constants';
import { createBasicInfoPageSchema, BasicInfoPageSchema } from '../utils/schema';
import { UNSET_BIRTH_YEAR, createDefaultMember } from '../utils/defaultValues';
import { useHouseholdMembersNavigation } from '../hooks/useHouseholdMembersNavigation';
import BasicInfoFields from '../sections/BasicInfoFields';
import DeleteConfirmationPopover from './DeleteConfirmationPopover';
import '../styles/HouseholdMemberBasicInfoPage.css';
import type { DeletePopoverState, LocationState } from '../utils/types';
import { useTrackEvent } from '../../../../Assets/analytics';
import { getStepAnalyticsId, HOUSEHOLD_SUBSTEP_IDS } from '../../../../Assets/analytics/stepIds';

const MAX_HOUSEHOLD_SIZE = 8;

const HouseholdMemberBasicInfoPage = () => {
  const { formData } = useContext(Context);
  const { uuid, whiteLabel } = useParams();
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const currentStepId = useStepNumber('householdData');
  const [deletePopover, setDeletePopover] = useState<DeletePopoverState>(null);
  const track = useTrackEvent();

  // Roster page (page 0), rendered outside QuestionComponentContainer, so it
  // tracks its own view. Emits the 'member-basics' sub-slug; complete/back use the
  // same slug. The screener_household_member action events below keep the parent
  // 'household-members' slug.
  useEffect(() => {
    track('screener_form_step', {
      screener_step_name: HOUSEHOLD_SUBSTEP_IDS.memberBasics,
      screener_step_number: currentStepId,
      step_action: 'view',
    });
    // Fire once on mount (one view event per page visit); `track`/`currentStepId`
    // are intentionally excluded so re-renders don't re-fire the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');
  const deleteHHMemberAriaLabel = intl.formatMessage({
    id: 'deleteHHMember.ariaText',
    defaultMessage: 'delete household member',
  });

  const navigate = useNavigate();
  const location = useLocation();
  // When the user reached page 0 from a member page (via the "manage members" pencil), we
  // remember which page they came from so Continue can return them there, along with whether
  // that page was in edit mode so we can restore it.
  const locationState = location.state as LocationState | null;
  const returnToPage = locationState?.returnToPage;
  const returnToEditing = locationState?.returnToEditing;
  // Where the edit should ultimately return to — the card that opened it, not the page the user
  // left to come here. Handed back below so Continue resumes the edit's original path.
  const editReturnToPage = locationState?.editReturnToPage;

  const { navigateBack } = useHouseholdMembersNavigation({
    uuid,
    whiteLabel,
    currentStepId,
    pageNumber: 0,
    redirectToConfirmationPage: false,
  });

  // Schema is intl-dependent — memoize so it isn't rebuilt on every render.
  const formSchema = useMemo(() => createBasicInfoPageSchema(intl), [intl]);

  // Identify the members these page numbers point at, so Continue can return to the same people
  // even if deletions here shifted their positions. Captured on mount, before any edits.
  const [returnToMemberId, editReturnToMemberId] = useMemo(
    () => [
      returnToPage !== undefined ? formData.householdData[returnToPage - 1]?.frontendId : undefined,
      editReturnToPage !== undefined ? formData.householdData[editReturnToPage - 1]?.frontendId : undefined,
    ],
    // Mount-only: formData shifts as members are removed, which would move the targets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const defaultMembers = useMemo(
    () =>
      Array.from({ length: formData.householdSize }, (_, index) => {
        const existing = formData.householdData[index];
        return {
          frontendId: existing?.frontendId,
          birthMonth: existing?.birthMonth || 0,
          birthYear: existing?.birthYear || UNSET_BIRTH_YEAR,
          relationshipToHH: existing?.relationshipToHH || (index === 0 ? 'headOfHousehold' : ''),
        };
      }),
    // Intentionally only on mount — we don't want formData changes mid-flow to reset fields.
    // eslint-disable-next-line
    [],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<BasicInfoPageSchema>({
    resolver: mfbZodResolver(formSchema),
    defaultValues: { members: defaultMembers },
    questionName: 'householdData',
    stepNameOverride: HOUSEHOLD_SUBSTEP_IDS.memberBasics,
    onSubmitSuccessfulOverride: () => {},
  });

  const { fields, remove, append } = useFieldArray({ control, name: 'members' });

  const formSubmitHandler: SubmitHandler<BasicInfoPageSchema> = async ({ members }) => {
    if (!uuid) return;

    // Match each row to its saved member by frontendId, not by array position: removing a member
    // shifts every later row down, so an index lookup would graft the deleted member's id,
    // insurance, conditions and income onto the row that took its place.
    const updatedHouseholdData = members.map((member, index) => {
      const existing = member.frontendId
        ? formData.householdData.find((saved) => saved.frontendId === member.frontendId)
        : undefined;

      return createDefaultMember(index, {
        ...existing,
        birthMonth: member.birthMonth,
        birthYear: member.birthYear,
        relationshipToHH: member.relationshipToHH,
      });
    });

    await updateScreen({
      ...formData,
      householdSize: members.length,
      householdData: updatedHouseholdData,
    });

    // This page navigates manually (onSubmitSuccessfulOverride) instead of through
    // the shared useGoToNextStep hook, so it must fire its own 'complete' event.
    track('screener_form_step', {
      screener_step_name: HOUSEHOLD_SUBSTEP_IDS.memberBasics,
      screener_step_number: currentStepId,
      step_action: 'complete',
    });

    // Resolve a page number captured before edits to where that same member sits now. Deleting an
    // earlier member shifts everyone after it down a page, so match by identity and fall back to
    // the clamped original when the member was deleted or predates frontendId.
    const resolvePage = (originalPage: number, memberId: string | undefined) => {
      const movedToIndex = memberId ? members.findIndex((member) => member.frontendId === memberId) : -1;
      return movedToIndex >= 0 ? movedToIndex + 1 : Math.min(Math.max(originalPage, 1), members.length);
    };

    const targetPage = returnToPage !== undefined ? resolvePage(returnToPage, returnToMemberId) : 1;

    // Restore edit mode if the user came here mid-edit, so the basic-info fields they were
    // editing are still shown, and hand back the edit's own destination so Continue resumes the
    // path it was on rather than falling through to normal next-member navigation.
    const editState = returnToEditing
      ? {
          isEditing: true,
          ...(editReturnToPage !== undefined && {
            returnToPage: resolvePage(editReturnToPage, editReturnToMemberId),
          }),
        }
      : {};

    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${targetPage}`, {
      state: { basicInfoCollected: true, ...editState },
    });
  };

  const handleDeleteConfirm = () => {
    if (deletePopover === null) return;
    remove(deletePopover.index);
    setDeletePopover(null);
    track('screener_household_member', {
      screener_step_name: getStepAnalyticsId('householdData'),
      screener_step_number: currentStepId,
      action: 'delete',
    });
  };

  const handleAddMember = () => {
    append({
      // New row: no saved member to match, so createDefaultMember mints an id on submit.
      frontendId: undefined,
      birthMonth: 0,
      birthYear: UNSET_BIRTH_YEAR,
      relationshipToHH: '',
    });
    track('screener_household_member', {
      screener_step_name: getStepAnalyticsId('householdData'),
      screener_step_number: currentStepId,
      action: 'add',
    });
  };

  // Note: screener_form_error is tracked centrally in useStepForm (stepForm.tsx),
  // which every screener step's form goes through — no need to duplicate it here.

  return (
    <main className="benefits-form" data-step-id="household-basics">
      <QuestionHeader>
        <FormattedMessage
          id="householdDataBlock.basicInfo.header"
          defaultMessage="Tell us about each household member"
        />
      </QuestionHeader>
      <QuestionDescription>
        <FormattedMessage
          id="householdDataBlock.basicInfo.subheader"
          defaultMessage="Enter each member's birth date. For members other than yourself, select their relationship to you."
        />
      </QuestionDescription>

      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <div className="household-basic-info-page__form-container">
          {fields.map((field, index) => {
            const memberErrors = errors.members?.[index];
            const isFirstMember = index === 0;
            return (
              <div key={field.id} className="household-basic-info-page__person-card">
                <div className="household-basic-info-page__person-header">
                  <Icon name="user-round" className="household-basic-info-page__person-icon" />
                  <Typography className="household-basic-info-page__person-title">
                    {isFirstMember ? (
                      <FormattedMessage id="householdDataBlock.basicInfo.you" defaultMessage="You" />
                    ) : (
                      <FormattedMessage
                        id="householdDataBlock.basicInfo.person"
                        defaultMessage="Person {number}"
                        values={{ number: index + 1 }}
                      />
                    )}
                  </Typography>
                  {!isFirstMember && (
                    <IconButton
                      onClick={(e) => setDeletePopover({ index, anchorEl: e.currentTarget })}
                      aria-label={deleteHHMemberAriaLabel}
                      size="small"
                      className="household-basic-info-page__delete-button"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>

                <Box sx={BASIC_INFO_GRID_STYLES}>
                  <BasicInfoFields
                    control={control}
                    namePrefix={`members.${index}`}
                    birthMonthError={memberErrors?.birthMonth}
                    birthYearError={memberErrors?.birthYear}
                    relationshipError={memberErrors?.relationshipToHH}
                    isFirstMember={isFirstMember}
                    relationshipOptions={relationshipOptions}
                  />
                </Box>
              </div>
            );
          })}
        </div>

        {fields.length < MAX_HOUSEHOLD_SIZE && (
          <Box sx={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
            <button type="button" onClick={handleAddMember} className="household-basic-info-page__add-button">
              <AddIcon fontSize="small" />
              <strong>
                <FormattedMessage id="householdDataBlock.basicInfo.addMember" defaultMessage="Add a Household Member" />
              </strong>
            </button>
          </Box>
        )}

        <PrevAndContinueButtons backNavigationFunction={navigateBack} stepNameOverride={HOUSEHOLD_SUBSTEP_IDS.memberBasics} />
      </form>

      <DeleteConfirmationPopover
        deletePopover={deletePopover}
        isDeleting={false}
        onClose={() => setDeletePopover(null)}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
};

export default HouseholdMemberBasicInfoPage;
