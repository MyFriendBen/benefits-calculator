import { ReactNode, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useFormatBirthMonthYear, calcAge, hasBirthMonthYear } from '../../Assets/age';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { Conditions, IncomeStream } from '../../Types/FormData';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import ConfirmationBlock, { formatToUSD, ConfirmationItem } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';
import { ReactComponent as Head } from '../../Assets/icons/General/head.svg';
import { calcIncomeStreamAmount } from '../../Assets/income';

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

type OptionMap = { [key: string]: FormattedMessageType };

const DefaultConfirmationHHData = () => {
  const { formData } = useContext(Context);
  const { householdData } = formData;

  const { formatMessage } = useIntl();

  const translateNumber = useTranslateNumber();
  const formatBirthMonthYear = useFormatBirthMonthYear();

  const relationshipOptions = useConfig<OptionMap>('relationship_options');
  const incomeOptions = useConfig<OptionMap>('income_options');
  const frequencyOptions = useConfig<OptionMap>('frequency_options');
  const healthInsuranceOptions = useConfig<{
    you: IconAndFormattedMessageMap;
    them: IconAndFormattedMessageMap;
  }>('health_insurance_options');

  const conditionsString = (specialConditions: Conditions) => {
    const conditionText = [];

    if (specialConditions.student) {
      conditionText.push(
        formatMessage({
          id: 'confirmation.headOfHouseholdDataBlock-studentText',
          defaultMessage: 'Student',
        }),
      );
    }

    if (specialConditions.pregnant) {
      conditionText.push(
        formatMessage({
          id: 'confirmation.headOfHouseholdDataBlock-pregnantText',
          defaultMessage: 'Pregnant',
        }),
      );
    }

    if (specialConditions.blindOrVisuallyImpaired) {
      conditionText.push(
        formatMessage({
          id: 'confirmation.headOfHouseholdDataBlock-blindOrVisuallyImpairedText',
          defaultMessage: 'Blind or visually impaired',
        }),
      );
    }

    if (specialConditions.disabled) {
      conditionText.push(
        formatMessage({
          id: 'confirmation.headOfHouseholdDataBlock-disabledText',
          defaultMessage: 'Disabled',
        }),
      );
    }

    if (specialConditions.longTermDisability) {
      conditionText.push(
        formatMessage({
          id: 'confirmation.longTermDisability',
          defaultMessage:
            'Has a medical or developmental condition that has lasted, or is expected to last, more than 12 months',
        }),
      );
    }

    if (conditionText.length === 0) {
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    // NOTE: we might want to redesign this to be more like a bullet list because
    // not every language will use commas to seperate a list.
    return conditionText.join(', ');
  };

  const listAllIncomeStreams = (incomeStreams: IncomeStream[]) => {
    const mappedListItems = incomeStreams.map((incomeStream, index) => {
      const incomeStreamName = incomeOptions[incomeStream.incomeStreamName];
      const incomeAmount = formatToUSD(Number(incomeStream.incomeAmount));
      const incomeFrequency = frequencyOptions[incomeStream.incomeFrequency];
      const hoursPerWeek = incomeStream.hoursPerWeek;
      const translatedHrsPerWkText = formatMessage({
        id: 'listAllIncomeStreams.hoursPerWeek',
        defaultMessage: ' hours/week ',
      });

      const translatedAnnualText = formatMessage({
        id: 'displayAnnualIncome.annual',
        defaultMessage: ' annually',
      });

      const incomeStreamAmount = calcIncomeStreamAmount(incomeStream);

      const annualAmount = `(${formatToUSD(incomeStreamAmount, 0)}` + translatedAnnualText + `)`;

      return (
        <li key={index}>
          <ConfirmationItem
            label={<>{incomeStreamName}:</>}
            value={
              incomeStream.incomeFrequency === 'hourly' ? (
                <>
                  {translateNumber(incomeAmount)} {incomeFrequency} ~{translateNumber(hoursPerWeek)}{' '}
                  {translatedHrsPerWkText} {translateNumber(annualAmount)}
                </>
              ) : (
                <>
                  {translateNumber(incomeAmount)} {incomeFrequency} {translateNumber(annualAmount)}
                </>
              )
            }
          />
        </li>
      );
    });

    return mappedListItems;
  };

  const editHouseholdMemberAriaLabel = {
    id: 'confirmation.hhMember.edit-AL',
    defaultMessage: 'edit household member',
  };
  const householdMemberIconAlt = {
    id: 'confirmation.hhMember.icon-AL',
    defaultMessage: 'household member',
  };

  const householdMemberDataBlocks = householdData.map((member, i) => {
    const { hasIncome, incomeStreams } = member;
    const age = calcAge(member);
    let relationship: FormattedMessageType;
    if (i === 0) {
      relationship = <FormattedMessage id="qcc.hoh-text" defaultMessage="Head of Household (You)" />;
    } else {
      relationship = relationshipOptions[member.relationshipToHH];
    }

    const displayHealthInsurance = () => {
      const insurance = member.healthInsurance;
      const selectedNone = insurance?.none === true;

      const youVsThemHealthInsuranceOptions = i === 0 ? healthInsuranceOptions.you : healthInsuranceOptions.them;

      const allOtherSelectedOptions = Object.entries(insurance ?? {})
        .filter((hHMemberInsEntry) => hHMemberInsEntry[1] === true)
        .map((insurance) => {
          const formattedMessageProp = youVsThemHealthInsuranceOptions[insurance[0]].text.props;
          return formatMessage({ ...formattedMessageProp });
        });

      if (selectedNone) {
        return <>{youVsThemHealthInsuranceOptions.none.text}</>;
      }
      return (
        <ul>
          {allOtherSelectedOptions.map((option, idx) => (
            <li key={idx}>{option}</li>
          ))}
        </ul>
      );
    };

    return (
      <ConfirmationBlock
        icon={<Head title={formatMessage(householdMemberIconAlt)} />}
        title={relationship}
        editAriaLabel={editHouseholdMemberAriaLabel}
        stepName="householdData"
        editUrlEnding={String(i + 1)}
        key={i}
      >
        <ConfirmationItem
          label={<FormattedMessage id="questions.age-inputLabel" defaultMessage="Age:" />}
          value={translateNumber(age)}
        />
        {hasBirthMonthYear(member) && (
          <ConfirmationItem
            label={<FormattedMessage id="confirmation.member.birthYearMonth" defaultMessage="Birth Month/Year:" />}
            value={formatBirthMonthYear(member)}
          />
        )}
        <ConfirmationItem
          label={
            <FormattedMessage id="confirmation.headOfHouseholdDataBlock-conditionsText" defaultMessage="Conditions:" />
          }
          value={conditionsString(member.conditions)}
        />
        <ConfirmationItem
          label={<FormattedMessage id="confirmation.headOfHouseholdDataBlock-incomeLabel" defaultMessage="Income:" />}
          value={
            hasIncome && incomeStreams.length > 0 ? (
              <ul>{listAllIncomeStreams(incomeStreams)}</ul>
            ) : (
              <FormattedMessage id="confirmation.noIncome" defaultMessage="None" />
            )
          }
        />
        {
          <ConfirmationItem
            label={
              <FormattedMessage
                id="confirmation.headOfHouseholdDataBlock-healthInsuranceText"
                defaultMessage="Health Insurance: "
              />
            }
            value={displayHealthInsurance()}
          />
        }
      </ConfirmationBlock>
    );
  });

  return <>{householdMemberDataBlocks}</>;
};

export default DefaultConfirmationHHData;
