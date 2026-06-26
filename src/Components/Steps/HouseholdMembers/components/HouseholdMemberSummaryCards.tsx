import { FormattedMessage, useIntl } from 'react-intl';
import { Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { calcAge, hasBirthMonthYear, useFormatBirthMonthYear } from '../../../../Assets/age';
import { useConfig } from '../../../Config/configHook';
import { useTranslateNumber } from '../../../../Assets/languageOptions';
import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType, QuestionName } from '../../../../Types/Questions';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useRef, useState } from 'react';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { Context } from '../../../Wrapper/Wrapper';
import DeleteConfirmationPopover from './DeleteConfirmationPopover';
import '../styles/HouseholdMemberSummaryCards.css';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { formatToUSD } from '../../../../utils/formatCurrency';
import useScreenApi from '../../../../Assets/updateScreen';
import type { DeletePopoverState } from '../utils/types';

type HHMSummariesProps = {
  questionName: QuestionName;
};

const HouseholdMemberSummaryCards = ({ questionName }: HHMSummariesProps) => {
  const { formData, whiteLabel } = useContext(Context);
  const { uuid, page } = useParams();
  const pageNumber = Number(page);
  const currentStepId = useStepNumber(questionName);
  const relationshipOptions = useConfig<{ [key: string]: FormattedMessageType }>('relationship_options');
  const headOfHHInfoWasEntered = formData.householdData.length >= 1;
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
  const formatBirthMonthYear = useFormatBirthMonthYear();
  const { updateScreen } = useScreenApi();
  const [deletePopover, setDeletePopover] = useState<DeletePopoverState>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handleEditBtnSubmit = (memberIndex: number) => {
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${memberIndex + 1}`, {
      state: { isEditing: true, returnToPage: pageNumber },
    });
  };

  const handleDeleteConfirm = async () => {
    if (deletePopover === null) return;
    const deletedIndex = deletePopover.index;
    setIsDeleting(true);
    try {
      const updatedHouseholdData = formData.householdData.filter((_, i) => i !== deletedIndex);
      await updateScreen({
        ...formData,
        householdSize: updatedHouseholdData.length,
        householdData: updatedHouseholdData,
      });
      // The delete button is hidden for the current member (memberIndex !== 0 guard + slice(0, pageNumber-1)),
      // so deletedIndex will always be < pageNumber in practice. The +1 guard is a safeguard.
      if (deletedIndex + 1 <= pageNumber) {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`, { state: { basicInfoCollected: true } });
      }
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
        setDeletePopover(null);
      }
    }
  };

  const createMemberCard = (
    memberIndex: number,
    memberData: HouseholdData,
    age: number,
    income: number,
    relationship_options: Record<string, FormattedMessageType>,
  ) => {
    const { relationshipToHH, birthYear, birthMonth } = memberData;
    const containerClassName = `member-added-container ${
      memberIndex + 1 === pageNumber ? 'current-household-member' : ''
    }`;

    let relationship = relationship_options[relationshipToHH];
    if (memberIndex === 0) {
      relationship = <FormattedMessage id="relationshipOptions.yourself" defaultMessage="Yourself" />;
    }

    return (
      <article className={containerClassName} key={memberIndex}>
        <div className="household-member-header">
          <h3 className="member-added-relationship">{relationship}:</h3>
          <div className="household-member-edit-button">
            <IconButton
              onClick={() => handleEditBtnSubmit(memberIndex)}
              aria-label={editHHMemberAriaLabel}
              size="small"
              sx={{ padding: 0 }}
            >
              <EditIcon />
            </IconButton>
            {memberIndex !== 0 && (
              <IconButton
                onClick={(e) => setDeletePopover({ index: memberIndex, anchorEl: e.currentTarget })}
                aria-label={deleteHHMemberAriaLabel}
                size="small"
                sx={{ padding: 0, color: 'rgba(0, 0, 0, 0.54)' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </div>
        </div>
        <div className="member-added-age">
          <strong>
            <FormattedMessage id="questions.age-inputLabel" defaultMessage="Age: " />
          </strong>
          {translateNumber(age)}
        </div>
        {hasBirthMonthYear({ birthMonth, birthYear }) && (
          <div className="member-added-age member-added-birth">
            <strong>
              <FormattedMessage id="householdDataBlock.memberCard.birthYearMonth" defaultMessage="Birth Month/Year: " />
            </strong>
            {formatBirthMonthYear({ birthMonth, birthYear })}
          </div>
        )}
        <div className="member-added-income">
          <strong>
            <FormattedMessage id="householdDataBlock.member-income" defaultMessage="Income: " />
          </strong>
          {translateNumber(formatToUSD(income))}
          <FormattedMessage id="displayAnnualIncome.annual" defaultMessage=" annually" />
        </div>
      </article>
    );
  };

  const createFormDataMemberCard = (
    memberIndex: number,
    member: HouseholdData,
    relationship_options: Record<string, FormattedMessageType>,
  ) => {
    if (member.birthYear && member.birthMonth) {
      let age = calcAge(member);

      if (Number.isNaN(age)) {
        age = 0;
      }

      const income = calcMemberYearlyIncome(member);

      return createMemberCard(memberIndex, member, age, income, relationship_options);
    }
  };

  const memberCards = formData.householdData
    .slice(0, pageNumber - 1)
    .map((member, memberIndex) => createFormDataMemberCard(memberIndex, member, relationshipOptions));

  return (
    <article key={pageNumber}>
      {headOfHHInfoWasEntered && memberCards.some(Boolean) && (
        <Box sx={{ marginBottom: '0.25rem' }}>
          <div>{memberCards}</div>
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
