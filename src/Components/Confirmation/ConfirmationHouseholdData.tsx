import { ReactNode, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useFormatBirthMonthYear, hasBirthMonthYear } from '../../Assets/age';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { HouseholdData } from '../../Types/FormData';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import { formatToUSD } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';
import { ReactComponent as Household } from '../../Assets/icons/General/household.svg';
import { ReactComponent as Edit } from '../../Assets/icons/General/edit.svg';
import { calcMemberYearlyIncome } from '../../Assets/income';
import { Link, useParams } from 'react-router-dom';
import { useStepNumber } from '../../Assets/stepDirectory';
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
  const { householdData, householdSize } = formData;
  const { whiteLabel, uuid } = useParams();
  const isEnergyCalculator = useIsEnergyCalculator();

  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();
  const formatBirthMonthYear = useFormatBirthMonthYear();

  const householdDataStepNumber = useStepNumber('householdData');

  const relationshipOptions = useConfig<OptionMap>('relationship_options');
  const healthInsuranceOptions = useConfig<{
    you: IconAndFormattedMessageMap;
    them: IconAndFormattedMessageMap;
  }>('health_insurance_options');

  const householdSizeText = `${translateNumber(householdSize)} ${formatMessage(
    { id: 'confirmation.householdSizeLabel', defaultMessage: '{count, plural, one {person} other {people}}' },
    { count: householdSize },
  )}`;

  const editHouseholdMemberAriaLabel = {
    id: 'confirmation.hhMember.edit-AL',
    defaultMessage: 'edit household member',
  };
  const householdSizeIconAlt = {
    id: 'confirmation.hhsize.icon-AL',
    defaultMessage: 'household size',
  };

  const getRelationship = (member: HouseholdData, index: number): string => {
    if (index === 0) {
      return formatMessage({ id: 'householdDataBlock.basicInfo.you', defaultMessage: 'You' });
    }
    return relationshipOptions[member.relationshipToHH]?.props
      ? formatMessage({ ...relationshipOptions[member.relationshipToHH].props })
      : member.relationshipToHH;
  };

  const conditionsString = (member: HouseholdData): string => {
    const conditions = isEnergyCalculator ? EC_CONDITIONS : MAIN_CONDITIONS;
    const conditionText = conditions
      .filter(({ isActive }) => isActive(member))
      .map(({ id, defaultMessage }) => formatMessage({ id, defaultMessage }));

    if (conditionText.length === 0) {
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    return conditionText.join(', ');
  };

  const calculateTotalAnnualIncome = (member: HouseholdData): string => {
    const { hasIncome, incomeStreams } = member;
    if (!hasIncome || incomeStreams.length === 0) {
      return formatMessage({ id: 'confirmation.noIncome', defaultMessage: 'None' });
    }
    return translateNumber(formatToUSD(calcMemberYearlyIncome(member), 0));
  };

  const displayHealthInsurance = (member: HouseholdData, memberIndex: number): string => {
    const insurance = member.healthInsurance;
    const youVsThemOptions = memberIndex === 0 ? healthInsuranceOptions.you : healthInsuranceOptions.them;

    if (insurance?.none === true) {
      const noneTextProps = youVsThemOptions.none?.text?.props;
      if (noneTextProps && 'id' in noneTextProps) {
        return formatMessage({ ...noneTextProps });
      }
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    const selectedOptions = Object.entries(insurance ?? {})
      .filter(([, selected]) => selected === true)
      .map(([key]) => {
        const option = youVsThemOptions[key];
        if (option?.text?.props && 'id' in option.text.props) {
          return formatMessage({ ...option.text.props });
        }
        return '';
      })
      .filter(text => text !== '');

    if (selectedOptions.length === 0) {
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    return selectedOptions.join(', ');
  };

  return (
    <div className="confirmation-section">
      <div className="confirmation-section-header">
        <h2>
          <div className="confirmation-icon">
            <Household title={formatMessage(householdSizeIconAlt)} />
          </div>
          <FormattedMessage id="confirmation.displayAllFormData-yourHouseholdLabel" defaultMessage="Household Members" />
          {' '}
          <span className="household-member-count">
            <span className="household-member-count-full">({householdSizeText})</span>
            <span className="household-member-count-short">({translateNumber(householdSize)})</span>
          </span>
        </h2>
      </div>
      <div className="confirmation-section-content">
        <div className="household-member-table-wrapper">
          {/* Desktop table view */}
          <table className="household-member-table household-member-table-desktop">
            <thead>
              <tr>
                <th scope="col">
                  <FormattedMessage id="confirmation.table.member" defaultMessage="Member" />
                </th>
                <th scope="col">
                  <FormattedMessage id="confirmation.member.birthYearMonth" defaultMessage="Birth Month/Year" />
                </th>
                <th scope="col">
                  <FormattedMessage id="confirmation.headOfHouseholdDataBlock-conditionsText" defaultMessage="Conditions" />
                </th>
                <th scope="col">
                  <FormattedMessage id="confirmation.annualIncome" defaultMessage="Annual Income" />
                </th>
                {!isEnergyCalculator && (
                  <th scope="col">
                    <FormattedMessage
                      id="confirmation.headOfHouseholdDataBlock-healthInsuranceText"
                      defaultMessage="Health Insurance"
                    />
                  </th>
                )}
                <th style={{ width: '40px' }} aria-hidden={true}></th>
              </tr>
            </thead>
            <tbody>
              {householdData.map((member, i) => {
                const relationship = getRelationship(member, i);
                const memberEditLabel = `${formatMessage(editHouseholdMemberAriaLabel)}: ${relationship}`;

                return (
                  <tr key={i}>
                    <td>{relationship}</td>
                    <td>
                      {hasBirthMonthYear(member) ? (
                        formatBirthMonthYear(member)
                      ) : (
                        <span aria-label={formatMessage({ id: 'confirmation.notProvided', defaultMessage: 'not provided' })}>-</span>
                      )}
                    </td>
                    <td>{conditionsString(member)}</td>
                    <td>{calculateTotalAnnualIncome(member)}</td>
                    {!isEnergyCalculator && <td>{displayHealthInsurance(member, i)}</td>}
                    <td>
                      <Link
                        to={`/${whiteLabel}/${uuid}/step-${householdDataStepNumber}/${i + 1}`}
                        state={{ routedFromConfirmationPg: true, isEditing: true }}
                        className="edit-button-simple"
                        aria-label={memberEditLabel}
                      >
                        <Edit aria-hidden={true} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile card view */}
          <div className="household-member-cards">
            {householdData.map((member, i) => {
              const relationship = getRelationship(member, i);
              const memberEditLabel = `${formatMessage(editHouseholdMemberAriaLabel)}: ${relationship}`;

              return (
                <div key={i} className="household-member-card">
                  <div className="household-member-card-header">
                    <h3 className="household-member-card-title">{relationship}</h3>
                    <Link
                      to={`/${whiteLabel}/${uuid}/step-${householdDataStepNumber}/${i + 1}`}
                      state={{ routedFromConfirmationPg: true, isEditing: true }}
                      className="edit-button-simple"
                      aria-label={memberEditLabel}
                    >
                      <Edit aria-hidden={true} />
                    </Link>
                  </div>
                  <div className="household-member-card-body">
                    <div className="household-member-card-field">
                      <span className="household-member-card-label">
                        <FormattedMessage id="confirmation.member.birthYearMonth" defaultMessage="Birth Month/Year" />
                      </span>
                      <span className="household-member-card-value">
                        {hasBirthMonthYear(member) ? (
                          formatBirthMonthYear(member)
                        ) : (
                          <span aria-label={formatMessage({ id: 'confirmation.notProvided', defaultMessage: 'not provided' })}>-</span>
                        )}
                      </span>
                    </div>
                    <div className="household-member-card-field">
                      <span className="household-member-card-label">
                        <FormattedMessage
                          id="confirmation.headOfHouseholdDataBlock-conditionsText"
                          defaultMessage="Conditions"
                        />
                      </span>
                      <span className="household-member-card-value">{conditionsString(member)}</span>
                    </div>
                    <div className="household-member-card-field">
                      <span className="household-member-card-label">
                        <FormattedMessage id="confirmation.annualIncome" defaultMessage="Annual Income" />
                      </span>
                      <span className="household-member-card-value">{calculateTotalAnnualIncome(member)}</span>
                    </div>
                    {!isEnergyCalculator && (
                      <div className="household-member-card-field">
                        <span className="household-member-card-label">
                          <FormattedMessage
                            id="confirmation.headOfHouseholdDataBlock-healthInsuranceText"
                            defaultMessage="Health Insurance"
                          />
                        </span>
                        <span className="household-member-card-value">{displayHealthInsurance(member, i)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultConfirmationHHData;
