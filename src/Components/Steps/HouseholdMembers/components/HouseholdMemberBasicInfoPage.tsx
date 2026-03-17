import { useContext, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFieldArray, SubmitHandler } from 'react-hook-form';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../../Wrapper/Wrapper';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import useScreenApi from '../../../../Assets/updateScreen';
import useStepForm from '../../stepForm';
import { FormattedMessageType } from '../../../../Types/Questions';
import { useConfig } from '../../../Config/configHook';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { ReactComponent as PersonIcon } from '../../../../Assets/icons/General/head.svg';
import { BASIC_INFO_GRID_STYLES } from '../utils/constants';
import { createBasicInfoPageSchema, BasicInfoPageSchema } from '../utils/schema';
import { UNSET_BIRTH_YEAR, createDefaultMember } from '../utils/defaultValues';
import { useHouseholdMembersNavigation } from '../hooks/useHouseholdMembersNavigation';
import BasicInfoFields from '../sections/BasicInfoFields';
import DeleteConfirmationPopover from './DeleteConfirmationPopover';
import '../styles/HouseholdMemberBasicInfoPage.css';
import type { DeletePopoverState } from '../utils/types';

const MAX_HOUSEHOLD_SIZE = 8;

const HouseholdMemberBasicInfoPage = () => {
  const { formData } = useContext(Context);
  const { uuid, whiteLabel } = useParams();
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const currentStepId = useStepNumber('householdData');
  const [deletePopover, setDeletePopover] = useState<DeletePopoverState>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');
  const deleteHHMemberAriaLabel = intl.formatMessage({
    id: 'deleteHHMember.ariaText',
    defaultMessage: 'delete household member',
  });

  const navigate = useNavigate();

  const { navigateBack } = useHouseholdMembersNavigation({
    uuid,
    whiteLabel,
    currentStepId,
    pageNumber: 0,
    redirectToConfirmationPage: false,
  });

  // Schema is intl-dependent — memoize so it isn't rebuilt on every render.
  const formSchema = useMemo(() => createBasicInfoPageSchema(intl), [intl]);

  const defaultMembers = useMemo(
    () =>
      Array.from({ length: formData.householdSize }, (_, index) => {
        const existing = formData.householdData[index];
        return {
          birthMonth: existing?.birthMonth || 0,
          birthYear: existing?.birthYear || UNSET_BIRTH_YEAR,
          relationshipToHH: existing?.relationshipToHH || (index === 0 ? 'headOfHousehold' : ''),
        };
      }),
    // Intentionally only on mount — we don't want formData changes mid-flow to reset fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useStepForm<BasicInfoPageSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { members: defaultMembers },
    questionName: 'householdData',
    onSubmitSuccessfulOverride: () => {},
  });

  const { fields, remove, append } = useFieldArray({ control, name: 'members' });

  const formSubmitHandler: SubmitHandler<BasicInfoPageSchema> = async ({ members }) => {
    if (!uuid) return;

    const updatedHouseholdData = members.map((member, index) =>
      createDefaultMember(index, {
        ...formData.householdData[index],
        birthMonth: member.birthMonth,
        birthYear: member.birthYear,
        relationshipToHH: member.relationshipToHH,
      }),
    );

    await updateScreen({
      ...formData,
      householdSize: members.length,
      householdData: updatedHouseholdData,
    });

    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/1`, { state: { basicInfoCollected: true } });
  };

  const handleDeleteConfirm = async () => {
    if (deletePopover === null) return;
    const deletedIndex = deletePopover.index;

    setIsDeleting(true);
    try {
      // Use the field array values as the source of truth — formData may not include members
      // that were added on this page before submitting.
      const currentMembers = getValues('members');
      const updatedHouseholdData = currentMembers
        .filter((_, i) => i !== deletedIndex)
        .map((member, i) => {
          const originalIndex = i < deletedIndex ? i : i + 1;
          return createDefaultMember(originalIndex, {
            // Carry over detail fields (income, insurance, etc.) for members already saved.
            // formData.householdData[originalIndex] may be undefined for newly-added members.
            ...formData.householdData[originalIndex],
            birthMonth: member.birthMonth,
            birthYear: member.birthYear,
            relationshipToHH: member.relationshipToHH,
          });
        });

      await updateScreen({
        ...formData,
        householdSize: updatedHouseholdData.length,
        householdData: updatedHouseholdData,
      });
      remove(deletedIndex);
    } finally {
      setIsDeleting(false);
      setDeletePopover(null);
    }
  };

  const handleAddMember = () => {
    append({
      birthMonth: 0,
      birthYear: UNSET_BIRTH_YEAR,
      relationshipToHH: '',
    });
  };

  return (
    <main className="benefits-form">
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
              <div
                key={field.id}
                className="household-basic-info-page__person-card"
              >
                <div className="household-basic-info-page__person-header">
                  <PersonIcon className="household-basic-info-page__person-icon" />
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
                <FormattedMessage
                  id="householdDataBlock.basicInfo.addMember"
                  defaultMessage="Add a Household Member"
                />
              </strong>
            </button>
          </Box>
        )}

        <PrevAndContinueButtons backNavigationFunction={navigateBack} />
      </form>

      <DeleteConfirmationPopover
        deletePopover={deletePopover}
        isDeleting={isDeleting}
        onClose={() => setDeletePopover(null)}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  );
};

export default HouseholdMemberBasicInfoPage;
