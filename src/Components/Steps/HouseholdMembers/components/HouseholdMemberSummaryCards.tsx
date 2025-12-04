import { FormattedMessage, useIntl } from 'react-intl';
import { Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ConstructionIcon from '@mui/icons-material/Construction';
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
    // Pass state to indicate we're in edit mode and where to return
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${memberIndex + 1}`, {
      state: { isEditing: true, returnToPage: pageNumber }
    });
  };

  const formatToUSD = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const createMemberCard = (
    memberIndex: number,
    memberData: HouseholdData | null,
    age: number,
    income: number | null,
    relationship_options: Record<string, FormattedMessageType>,
    isCompleted: boolean,
  ) => {
    const isCurrentMember = memberIndex + 1 === pageNumber;
    const containerClassName = `member-added-container ${
      isCompleted ? 'completed-household-member' : ''
    } ${isCurrentMember ? 'current-household-member' : ''}`;

    let relationship;
    if (memberData) {
      const { relationshipToHH } = memberData;
      relationship = relationship_options[relationshipToHH];
      if (memberIndex === 0) {
        relationship = <FormattedMessage id="relationshipOptions.yourself" defaultMessage="Yourself" />;
      }
    } else {
      // For future members, show a generic label
      relationship = <FormattedMessage id="householdDataBlock.householdMember" defaultMessage="Household Member" />;
    }

    return (
      <article
        className={containerClassName}
        key={memberIndex}
        onClick={isCompleted ? () => handleEditBtnSubmit(memberIndex) : undefined}
        role={isCompleted ? "button" : undefined}
        tabIndex={isCompleted ? 0 : undefined}
        aria-label={isCompleted ? editHHMemberAriaLabel : undefined}
      >
        <div className="household-member-status-icon">
          {isCurrentMember ? (
            <ConstructionIcon className="current-icon" sx={{ fontSize: '.9rem' }} />
          ) : (
            isCompleted && <CheckCircleIcon className="completed-icon" sx={{ fontSize: '.9rem' }} />
          )}
        </div>
        <div className="household-member-header">
          <h3 className="member-added-relationship">
            {relationship} ({translateNumber(age)})
          </h3>
        </div>
        {isCompleted && (
          <div className="member-added-income">
            <strong>
              <FormattedMessage id="householdDataBlock.member-income" defaultMessage="Annual Income: " />
            </strong>
            {translateNumber(formatToUSD(Number(income)))}
          </div>
        )}
        {isCompleted && (
          <div className="hover-edit-button">
            <FormattedMessage id="householdDataBlock.edit" defaultMessage="Edit" />
          </div>
        )}
      </article>
    );
  };

  const isMemberCompleted = (member: HouseholdData) => {
    // A member is completed if they have basic info (birthYear, birthMonth, relationshipToHH)
    // and have answered the health insurance question (at least one insurance type selected)
    const hasAnsweredInsurance = member.healthInsurance &&
      Object.values(member.healthInsurance).some((value) => value === true);

    return Boolean(
      member.birthYear &&
      member.birthMonth &&
      member.relationshipToHH &&
      hasAnsweredInsurance
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
      const isCompleted = isMemberCompleted(member);

      return createMemberCard(memberIndex, member, age, income, relationship_options, isCompleted);
    }
  };

  // Create a placeholder card for members not yet entered
  const createPlaceholderMemberCard = (
    memberIndex: number,
    relationship_options: Record<string, FormattedMessageType>,
  ) => {
    // Use a default age of 0 for placeholder cards
    return createMemberCard(memberIndex, null, 0, null, relationship_options, false);
  };

  // Show all household members - both completed and pending
  const allMemberCards = [];
  for (let i = 0; i < formData.householdSize; i++) {
    const memberData = formData.householdData[i];

    if (memberData && memberData.birthYear && memberData.birthMonth) {
      // Member has at least basic info - show their card
      allMemberCards.push(createFormDataMemberCard(i, memberData, relationshipOptions));
    } else {
      // Member hasn't been entered yet - show placeholder
      allMemberCards.push(createPlaceholderMemberCard(i, relationshipOptions));
    }
  }

  return (
    <article key={pageNumber}>
      {headOfHHInfoWasEntered && (
        <Box sx={{ marginBottom: '0.5rem' }}>
          <div className="household-members-grid">{allMemberCards}</div>
        </Box>
      )}
    </article>
  );
};

export default HHMSummaries;
