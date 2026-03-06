import { ReactNode, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useFormatBirthMonthYear, calcAge, hasBirthMonthYear } from '../../Assets/age';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { HouseholdData, IncomeStream } from '../../Types/FormData';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import ConfirmationBlock, { formatToUSD, ConfirmationItem } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';
import { ReactComponent as Head } from '../../Assets/icons/General/head.svg';
import { calcIncomeStreamAmount } from '../../Assets/income';
import { useIsEnergyCalculator } from '../EnergyCalculator/hooks';

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

type OptionMap = { [key: string]: FormattedMessageType };

type ConditionEntry = { isActive: (m: HouseholdData) => boolean; id: string; defaultMessage: string };

const MAIN_CONDITIONS: ConditionEntry[] = [
  { isActive: (m) => m.conditions.student, id: 'confirmation.headOfHouseholdDataBlock-studentText', defaultMessage: 'Student' },
  { isActive: (m) => m.conditions.pregnant, id: 'confirmation.headOfHouseholdDataBlock-pregnantText', defaultMessage: 'Pregnant' },
  { isActive: (m) => m.conditions.blindOrVisuallyImpaired, id: 'confirmation.headOfHouseholdDataBlock-blindOrVisuallyImpairedText', defaultMessage: 'Blind or visually impaired' },
  { isActive: (m) => m.conditions.disabled, id: 'confirmation.headOfHouseholdDataBlock-disabledText', defaultMessage: 'Disabled' },
  { isActive: (m) => m.conditions.longTermDisability, id: 'confirmation.longTermDisability', defaultMessage: 'Has a medical or developmental condition that has lasted, or is expected to last, more than 12 months' },
];

const EC_CONDITIONS: ConditionEntry[] = [
  { isActive: (m) => m.energyCalculator?.survivingSpouse ?? false, id: 'eCConditionOptions.survivingSpouse', defaultMessage: 'Surviving Spouse' },
  { isActive: (m) => m.conditions.disabled, id: 'confirmationHHData.disability', defaultMessage: 'Disability' },
  { isActive: (m) => m.energyCalculator?.medicalEquipment ?? false, id: 'confirmationHHData.medicalEquipment', defaultMessage: 'In-home medical equipment' },
];

const DefaultConfirmationHHData = () => {
  const { formData } = useContext(Context);
  const { householdData } = formData;
  const isEnergyCalculator = useIsEnergyCalculator();

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

  const conditionsDisplay = (member: HouseholdData) => {
    const conditions = isEnergyCalculator ? EC_CONDITIONS : MAIN_CONDITIONS;
    const conditionText = conditions
      .filter(({ isActive }) => isActive(member))
      .map(({ id, defaultMessage }) => formatMessage({ id, defaultMessage }));

    if (conditionText.length === 0) {
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    return (
      <ul>
        {conditionText.map((text, idx) => (
          <li key={idx}>{text}</li>
        ))}
      </ul>
    );
  };

  const listAllIncomeStreams = (incomeStreams: IncomeStream[]) => {
    const hrsPerWkText = formatMessage({ id: 'listAllIncomeStreams.hoursPerWeek', defaultMessage: ' hours/week ' });
    const annualText = formatMessage({ id: 'displayAnnualIncome.annual', defaultMessage: ' annually' });

    return incomeStreams.map((incomeStream, index) => {
      const incomeStreamName = incomeOptions[incomeStream.incomeStreamName];
      const incomeAmount = formatToUSD(incomeStream.incomeAmount);
      const incomeFrequency = frequencyOptions[incomeStream.incomeFrequency];
      const annualAmount = `(${formatToUSD(calcIncomeStreamAmount(incomeStream), 0)}${annualText})`;

      return (
        <li key={index}>
          <ConfirmationItem
            label={<>{incomeStreamName}:</>}
            value={
              incomeStream.incomeFrequency === 'hourly' ? (
                <>
                  {translateNumber(incomeAmount)} {incomeFrequency} ~{translateNumber(incomeStream.hoursPerWeek)}{' '}
                  {hrsPerWkText} {translateNumber(annualAmount)}
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
  };

  const displayHealthInsurance = (member: HouseholdData, i: number) => {
    const insurance = member.healthInsurance;
    const youVsThemOptions = i === 0 ? healthInsuranceOptions.you : healthInsuranceOptions.them;

    if (insurance?.none === true) {
      return <>{youVsThemOptions.none.text}</>;
    }

    const selectedOptions = Object.entries(insurance ?? {})
      .filter(([, selected]) => selected === true)
      .map(([key]) => formatMessage({ ...youVsThemOptions[key].text.props }));

    return (
      <ul>
        {selectedOptions.map((option, idx) => (
          <li key={idx}>{option}</li>
        ))}
      </ul>
    );
  };

  return (
    <>
      {householdData.map((member, i) => {
        const { hasIncome, incomeStreams } = member;
        const relationship =
          i === 0 ? (
            <FormattedMessage id="qcc.hoh-text" defaultMessage="Head of Household (You)" />
          ) : (
            relationshipOptions[member.relationshipToHH]
          );

        return (
          <ConfirmationBlock
            icon={<Head title={formatMessage({ id: 'confirmation.hhMember.icon-AL', defaultMessage: 'household member' })} />}
            title={relationship}
            editAriaLabel={{ id: 'confirmation.hhMember.edit-AL', defaultMessage: 'edit household member' }}
            stepName="householdData"
            editUrlEnding={String(i + 1)}
            key={i}
          >
            <ConfirmationItem
              label={<FormattedMessage id="questions.age-inputLabel" defaultMessage="Age:" />}
              value={translateNumber(calcAge(member))}
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
              value={conditionsDisplay(member)}
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
            {!isEnergyCalculator && (
              <ConfirmationItem
                label={
                  <FormattedMessage
                    id="confirmation.headOfHouseholdDataBlock-healthInsuranceText"
                    defaultMessage="Health Insurance: "
                  />
                }
                value={displayHealthInsurance(member, i)}
              />
            )}
          </ConfirmationBlock>
        );
      })}
    </>
  );
};

export default DefaultConfirmationHHData;
