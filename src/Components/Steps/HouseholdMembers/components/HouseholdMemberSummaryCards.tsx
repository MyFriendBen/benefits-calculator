import { FormattedMessage, useIntl } from 'react-intl';
import { Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { calcAge } from '../../../../Assets/age';
import { useConfig } from '../../../Config/configHook';
import { useTranslateNumber } from '../../../../Assets/languageOptions';
import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType, QuestionName } from '../../../../Types/Questions';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { Context } from '../../../Wrapper/Wrapper';
import '../styles/HouseholdMemberSummaryCards.css';
import { calcMemberYearlyIncome } from '../../../../Assets/income';

type HHMSummariesProps = {
  activeMemberData: HouseholdData;
  triggerValidation: () => Promise<boolean>;
  questionName: QuestionName;
};

const HHMSummaries = ({ activeMemberData, triggerValidation, questionName }: HHMSummariesProps) => {
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
  const navigate = useNavigate();

  const handleEditBtnSubmit = async (memberIndex: number) => {
    // Navigate directly without validation when editing a member
    // Validation will happen when they submit that member's form
    // Pass state to indicate we're in edit mode
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${memberIndex + 1}`, { state: { isEditing: true } });
  };

  const formatToUSD = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const createMemberCard = (
    memberIndex: number,
    memberData: HouseholdData,
    age: number,
    income: number,
    relationship_options: Record<string, FormattedMessageType>,
  ) => {
    const { relationshipToHH } = memberData;
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
          <h3 className="member-added-relationship">
            {relationship} ({translateNumber(age)})
          </h3>
          <div className="household-member-edit-button">
            <IconButton
              onClick={() => {
                handleEditBtnSubmit(memberIndex);
              }}
              aria-label={editHHMemberAriaLabel}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
        <div className="member-added-income">
          <strong>
            <FormattedMessage id="householdDataBlock.member-income" defaultMessage="Annual Income: " />
          </strong>
          {translateNumber(formatToUSD(Number(income)))}
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

  //hHMemberSummaries will have the length of members that have already been saved to formData
  //We only want to show members that come BEFORE the current member (already completed)
  const summariesWActiveMemberCard = [
    ...formData.householdData
      .slice(0, pageNumber - 1) // Only show members before the current one
      .map((member, memberIndex) => {
        return createFormDataMemberCard(memberIndex, member, relationshipOptions);
      }),
  ];

  return (
    <article key={pageNumber}>
      {headOfHHInfoWasEntered && (
        <Box sx={{ marginBottom: '1.5rem' }}>
          <div>{summariesWActiveMemberCard}</div>
        </Box>
      )}
    </article>
  );
};

export default HHMSummaries;
