import { FormattedMessage, useIntl } from 'react-intl';
import { Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { calcAge, hasBirthMonthYear, useFormatBirthMonthYear } from '../../../Assets/age';
import { useConfig } from '../../Config/configHook';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { FormData, HouseholdData } from '../../../Types/FormData';
import { FormattedMessageType, QuestionName } from '../../../Types/Questions';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import { WrapperContext } from '../../../Types/WrapperContext';
import { useStepNumber } from '../../../Assets/stepDirectory';
import { Context } from '../../Wrapper/Wrapper';
import './HHMSummaryCards.css';
import { calcMemberYearlyIncome } from '../../../Assets/income';
import { formatToUSD } from '../../Confirmation/ConfirmationBlock';

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
  const formatBirthMonthYear = useFormatBirthMonthYear();

  const handleEditBtnSubmit = async (memberIndex: number) => {
    const isValid = await triggerValidation();
    if (isValid) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${memberIndex + 1}`);
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
              onClick={() => {
                handleEditBtnSubmit(memberIndex);
              }}
              aria-label={editHHMemberAriaLabel}
            >
              <EditIcon />
            </IconButton>
          </div>
        </div>
        <div className="member-added-age">
          <strong>
            <FormattedMessage id="questions.age-inputLabel" defaultMessage="Age: " />
          </strong>
          {translateNumber(age)}
        </div>
        {hasBirthMonthYear({ birthMonth, birthYear }) && (
          <div className="member-added-age">
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

  //hHMemberSummaries will have the length of members that have already been saved to formData
  //We want the active/current member's summary card to update synchronously as we change their information
  //so we swap out the current one for the one we create using the memberData in state
  const summariesWActiveMemberCard = [
    ...formData.householdData.map((member, memberIndex) => {
      if (memberIndex === pageNumber - 1) {
        // Update the current member synchronously
        return createFormDataMemberCard(memberIndex, activeMemberData, relationshipOptions);
      }
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
