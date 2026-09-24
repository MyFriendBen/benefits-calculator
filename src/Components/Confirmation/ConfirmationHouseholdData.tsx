import { ReactNode, useContext } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { useFormatBirthMonthYear, hasBirthMonthYear } from '../../Assets/age';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { HouseholdData, StudentEligibility } from '../../Types/FormData';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import ConfirmationBlock, { formatToUSD } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';
import { Icon } from '../Icon/Icon';
import { Pencil } from 'lucide-react';
import { calcMemberYearlyIncome } from '../../Assets/income';
import { Link, useParams } from 'react-router-dom';
import { useStepNumber } from '../../Assets/stepDirectory';
import { useIsEnergyCalculator } from '../EnergyCalculator/hooks';
import { useTrackEvent } from '../../Assets/analytics';

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

type OptionMap = { [key: string]: FormattedMessageType };

type ConditionEntry = {
  isActive: (m: HouseholdData) => boolean;
  id: string;
  defaultMessage: string;
  /** Optional discriminator for entries that render sub-answers */
  kind?: 'student';
};

const MAIN_CONDITIONS: ConditionEntry[] = [
  { isActive: (m) => m.conditions.student, id: 'confirmation.headOfHouseholdDataBlock-studentText', defaultMessage: 'Student', kind: 'student' },
  { isActive: (m) => m.conditions.pregnant, id: 'confirmation.headOfHouseholdDataBlock-pregnantText', defaultMessage: 'Pregnant' },
  { isActive: (m) => m.conditions.blindOrVisuallyImpaired, id: 'confirmation.headOfHouseholdDataBlock-blindOrVisuallyImpairedText', defaultMessage: 'Blind or visually impaired' },
  { isActive: (m) => m.conditions.disabled, id: 'confirmation.headOfHouseholdDataBlock-disabledText', defaultMessage: 'Disabled' },
  { isActive: (m) => m.conditions.longTermDisability, id: 'confirmation.longTermDisability', defaultMessage: 'Has a medical or developmental condition that has lasted, or is expected to last, more than 12 months' },
  { isActive: (m) => m.conditions.fosterCare, id: 'confirmation.fosterCare', defaultMessage: 'Ever in foster care' },
];

const EC_CONDITIONS: ConditionEntry[] = [
  { isActive: (m) => m.energyCalculator?.survivingSpouse ?? false, id: 'eCConditionOptions.survivingSpouse', defaultMessage: 'Surviving Spouse' },
  { isActive: (m) => m.conditions.disabled, id: 'confirmationHHData.disability', defaultMessage: 'Disability' },
  { isActive: (m) => m.energyCalculator?.medicalEquipment ?? false, id: 'confirmationHHData.medicalEquipment', defaultMessage: 'In-home medical equipment' },
];

type StudentEligibilityItem = {
  field: keyof StudentEligibility;
  labelId: string;
  labelDefault: string;
};

const STUDENT_ELIGIBILITY_ITEMS: StudentEligibilityItem[] = [
  {
    field: 'studentFullTime',
    labelId: 'confirmation.studentEligibility.enrolledHalfTime',
    labelDefault: 'Enrolled half-time or more',
  },
  {
    field: 'studentJobTrainingProgram',
    labelId: 'confirmation.studentEligibility.jobTrainingProgram',
    labelDefault: 'Job training program',
  },
  {
    field: 'studentHasWorkStudy',
    labelId: 'confirmation.studentEligibility.workStudy',
    labelDefault: 'Work study program',
  },
  {
    field: 'studentWorks20PlusHrs',
    labelId: 'confirmation.studentEligibility.works20PlusHrs',
    labelDefault: 'Works 20+ hrs/week',
  },
];

const DefaultConfirmationHHData = () => {
  const { formData } = useContext(Context);
  const { householdData, householdSize } = formData;
  const { whiteLabel, uuid } = useParams();
  const isEnergyCalculator = useIsEnergyCalculator();

  const { formatMessage } = useIntl();
  const translateNumber = useTranslateNumber();
  const formatBirthMonthYear = useFormatBirthMonthYear();
  const track = useTrackEvent();

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

  const getRelationship = (member: HouseholdData, index: number): string => {
    if (index === 0) {
      return formatMessage({ id: 'householdDataBlock.basicInfo.you', defaultMessage: 'You' });
    }
    return relationshipOptions[member.relationshipToHH]?.props
      ? formatMessage({ ...relationshipOptions[member.relationshipToHH].props })
      : member.relationshipToHH;
  };

  const renderConditions = (member: HouseholdData): ReactNode => {
    const conditions = isEnergyCalculator ? EC_CONDITIONS : MAIN_CONDITIONS;
    const activeConditions = conditions.filter(({ isActive }) => isActive(member));

    if (activeConditions.length === 0) {
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    const studentElig = member.studentEligibility;
    // Only questions that were actually answered get a row — an unanswered one
    // must not render as "No".
    const answeredStudentItems = STUDENT_ELIGIBILITY_ITEMS.flatMap((item) => {
      const value = studentElig?.[item.field];
      return value === undefined ? [] : [{ ...item, value }];
    }) as Array<StudentEligibilityItem & { value: boolean }>;

    return (
      <ul className="confirmation-conditions-list">
        {activeConditions.map(({ id, defaultMessage, kind }) => (
          <li key={id}>
            {formatMessage({ id, defaultMessage })}
            {kind === 'student' && answeredStudentItems.length > 0 && (
              <ul className="confirmation-student-eligibility-list">
                {answeredStudentItems.map(({ field, labelId, labelDefault, value }) => (
                  <li key={field}>
                    <FormattedMessage
                      id="confirmation.studentEligibility.item"
                      defaultMessage="{label}: {answer}"
                      values={{
                        label: <FormattedMessage id={labelId} defaultMessage={labelDefault} />,
                        answer: (
                          <FormattedMessage
                            id={value ? 'radiofield.label-yes' : 'radiofield.label-no'}
                            defaultMessage={value ? 'Yes' : 'No'}
                          />
                        ),
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
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
      .filter((text) => text !== '');

    if (selectedOptions.length === 0) {
      return formatMessage({ id: 'confirmation.none', defaultMessage: 'None' });
    }

    return selectedOptions.join(', ');
  };

  return (
    <ConfirmationBlock
      icon={<Icon name="users" className="confirmation-lucide-icon" aria-hidden={true} />}
      title={
        <>
          <FormattedMessage id="confirmation.displayAllFormData-yourHouseholdLabel" defaultMessage="Household Members" />
          {' '}
          <span className="household-member-count">
            <span className="household-member-count-full">({householdSizeText})</span>
            <span className="household-member-count-short">({translateNumber(householdSize)})</span>
          </span>
        </>
      }
      // household size is its own step, collected one page before household member details
      stepName="householdSize"
      editAriaLabel={{ id: 'confirmation.household.edit-AL', defaultMessage: 'edit household members' }}
    >
      <div className="household-member-table-wrapper">
        <table className="household-member-table household-member-table-desktop">
          <caption className="confirmation-sr-only">
            <FormattedMessage
              id="confirmation.householdTable.caption"
              defaultMessage="Household member details"
            />
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <FormattedMessage id="confirmation.table.member" defaultMessage="Member" />
              </th>
              <th scope="col">
                <FormattedMessage id="confirmation.member.birthYearMonth" defaultMessage="Birth Month/Year:" />
              </th>
              <th scope="col" style={{ width: '30%' }}>
                <FormattedMessage id="confirmation.headOfHouseholdDataBlock-conditionsText" defaultMessage="Conditions:" />
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
                      <span
                        aria-label={formatMessage({
                          id: 'confirmation.notProvided',
                          defaultMessage: 'not provided',
                        })}
                      >
                        -
                      </span>
                    )}
                  </td>
                  <td>{renderConditions(member)}</td>
                  <td>{calculateTotalAnnualIncome(member)}</td>
                  {!isEnergyCalculator && <td>{displayHealthInsurance(member, i)}</td>}
                  <td>
                    <Link
                      to={`/${whiteLabel}/${uuid}/step-${householdDataStepNumber}/${i + 1}`}
                      state={{ routedFromConfirmationPg: true, isEditing: true }}
                      className="edit-button-simple"
                      aria-label={memberEditLabel}
                      onClick={() => track('screener_confirmation_edit', { section: 'householdData' })}
                    >
                      <Pencil aria-hidden={true} className="edit-pencil-icon" strokeWidth={1.5} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ConfirmationBlock>
  );
};

export default DefaultConfirmationHHData;
