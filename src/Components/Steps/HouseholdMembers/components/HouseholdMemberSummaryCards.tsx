import { FormattedMessage, useIntl } from 'react-intl';
import { Box } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { calcAge } from '../../../../Assets/age';
import { useConfig } from '../../../Config/configHook';
import { useTranslateNumber } from '../../../../Assets/languageOptions';
import { HouseholdData } from '../../../../Types/FormData';
import { FormattedMessageType, QuestionName } from '../../../../Types/Questions';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyboardEvent, useContext } from 'react';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { Context } from '../../../Wrapper/Wrapper';
import '../styles/HouseholdMemberSummaryCards.css';
import { calcMemberYearlyIncome } from '../../../../Assets/income';
import { formatToUSD } from '../../../../utils/formatCurrency';

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
  const headOfHHInfoWasEntered = formData.householdData.length >= 1;
  const translateNumber = useTranslateNumber();
  const intl = useIntl();
  const editHHMemberAriaLabel = intl.formatMessage({
    id: 'editHHMember.ariaText',
    defaultMessage: 'edit household member',
  });
  const navigate = useNavigate();

  // Navigate straight to the member's page without re-validating — validation runs when
  // they submit that member's form. `returnToPage` lets the form send the user back here.
  const goToMember = (memberIndex: number) => {
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${memberIndex + 1}`, {
      state: { isEditing: true, returnToPage: pageNumber },
    });
  };

  const createMemberCard = (memberIndex: number, member: HouseholdData | undefined) => {
    const isCurrentMember = memberIndex + 1 === pageNumber;
    const isCompleted = isMemberCompleted(member);
    // Only completed, non-current cards are editable: the current member is being entered
    // right now, and incomplete members have nothing to edit yet.
    const isEditable = isCompleted && !isCurrentMember;

    let age = member ? calcAge(member) : 0;
    if (Number.isNaN(age)) {
      age = 0;
    }
    const income = isCompleted ? calcMemberYearlyIncome(member) : null;

    let relationship: FormattedMessageType;
    if (memberIndex === 0) {
      relationship = <FormattedMessage id="relationshipOptions.yourself" defaultMessage="Yourself" />;
    } else if (member) {
      relationship = relationshipOptions[member.relationshipToHH];
    } else {
      relationship = <FormattedMessage id="householdDataBlock.householdMember" defaultMessage="Household Member" />;
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
            <ConstructionIcon className="current-icon" sx={{ fontSize: '.9rem' }} aria-hidden="true" />
          </div>
        )}
        {isEditable && (
          <div className="household-member-status-icon">
            <CheckCircleIcon className="completed-icon" sx={{ fontSize: '.9rem' }} aria-hidden="true" />
          </div>
        )}
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
            {translateNumber(formatToUSD(income ?? 0))}
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

  // Render one card per household slot — completed members show their data, the rest are placeholders.
  const allMemberCards = Array.from({ length: formData.householdSize }, (_, i) =>
    createMemberCard(i, formData.householdData[i]),
  );

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

export default HouseholdMemberSummaryCards;
