import { ReactNode, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useFormatBirthMonthYear, hasBirthMonthYear } from '../../Assets/age';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { Conditions } from '../../Types/FormData';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import { formatToUSD } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';
import { ReactComponent as Edit } from '../../Assets/icons/General/edit.svg';
import { calcIncomeStreamAmount } from '../../Assets/income';
import { Link, useParams } from 'react-router-dom';
import { useStepNumber } from '../../Assets/stepDirectory';

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
  const { whiteLabel, uuid } = useParams();

  const { formatMessage } = useIntl();

  const translateNumber = useTranslateNumber();
  const formatBirthMonthYear = useFormatBirthMonthYear();

  const relationshipOptions = useConfig<OptionMap>('relationship_options');
  const healthInsuranceOptions = useConfig<{
    you: IconAndFormattedMessageMap;
    them: IconAndFormattedMessageMap;
  }>('health_insurance_options');

  const conditionsString = (specialConditions: Conditions) => {
    const conditionText = [];

    if (specialConditions.student !== undefined && specialConditions.student) {
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

  const editHouseholdMemberAriaLabel = {
    id: 'confirmation.hhMember.edit-AL',
    defaultMessage: 'edit household member',
  };

  const displayHealthInsurance = (member: any, memberIndex: number) => {
    const insurance = member.healthInsurance;
    const selectedNone = insurance?.none === true;

    const youVsThemHealthInsuranceOptions = memberIndex === 0 ? healthInsuranceOptions.you : healthInsuranceOptions.them;

    const allOtherSelectedOptions = Object.entries(insurance ?? {})
      .filter((hHMemberInsEntry) => hHMemberInsEntry[1] === true)
      .map((insurance) => {
        const formattedMessageProp = youVsThemHealthInsuranceOptions[insurance[0]].text.props;
        return formatMessage({ ...formattedMessageProp });
      });

    if (selectedNone) {
      return youVsThemHealthInsuranceOptions.none.text;
    }
    return allOtherSelectedOptions.join(', ');
  };

  const calculateTotalAnnualIncome = (member: any) => {
    const { hasIncome, incomeStreams } = member;
    if (!hasIncome || incomeStreams.length === 0) {
      return formatMessage({ id: 'confirmation.noIncome', defaultMessage: 'None' });
    }

    const totalAnnual = incomeStreams.reduce((total: number, stream: any) => {
      return total + calcIncomeStreamAmount(stream);
    }, 0);

    return translateNumber(formatToUSD(totalAnnual, 0));
  };

  // Return just the table without the ConfirmationBlock wrapper
  return (
    <div className="household-member-table-wrapper">
      <table className="household-member-table">
        <thead>
          <tr>
            <th><FormattedMessage id="confirmation.table.member" defaultMessage="Member" /></th>
            <th><FormattedMessage id="confirmation.member.birthYearMonth" defaultMessage="Birth Month/Year" /></th>
            <th><FormattedMessage id="confirmation.headOfHouseholdDataBlock-conditionsText" defaultMessage="Conditions" /></th>
            <th><FormattedMessage id="confirmation.annualIncome" defaultMessage="Annual Income" /></th>
            <th><FormattedMessage id="confirmation.headOfHouseholdDataBlock-healthInsuranceText" defaultMessage="Health Insurance" /></th>
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {householdData.map((member, i) => {
            let relationship: string | FormattedMessageType;
            if (i === 0) {
              relationship = formatMessage({ id: "qcc.hoh-text", defaultMessage: "Head of Household (You)" });
            } else {
              relationship = relationshipOptions[member.relationshipToHH];
            }

            return (
              <tr key={i}>
                <td>{relationship}</td>
                <td>{hasBirthMonthYear(member) ? formatBirthMonthYear(member) : '-'}</td>
                <td>{conditionsString(member.specialConditions)}</td>
                <td>{calculateTotalAnnualIncome(member)}</td>
                <td>{displayHealthInsurance(member, i)}</td>
                <td>
                  <Link
                    to={`/${whiteLabel}/${uuid}/step-${useStepNumber('householdData')}/${i + 1}`}
                    state={{ routedFromConfirmationPg: true }}
                    className="edit-button-simple"
                    aria-label={formatMessage(editHouseholdMemberAriaLabel)}
                  >
                    <Edit title={formatMessage(editHouseholdMemberAriaLabel)} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DefaultConfirmationHHData;
