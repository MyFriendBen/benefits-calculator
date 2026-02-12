import { Link } from 'react-router-dom';
import { Program } from '../../../Types/Results';
import { FormattedMessage } from 'react-intl';
import { useFormatDisplayValue } from '../FormattedValue';
import ResultsTranslate from '../Translate/Translate';
import { useContext, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import './ProgramCard.css';
import { findMemberEligibilityMember, findValidationForProgram, useResultsContext, useResultsLink } from '../Results';
import { FormattedMessageType } from '../../../Types/Questions';
import { BREAKPOINTS } from '../../../utils/breakpoints';
import { Context } from '../../Wrapper/Wrapper';
import { useConfig, useFeatureFlag } from '../../Config/configHook';
import { calcAge } from '../../../Assets/age';

type ResultsCardDetail = {
  title: FormattedMessageType;
  value: FormattedMessageType | string;
};

function ResultsCardDetail({ title, value }: ResultsCardDetail) {
  return (
    <div className="result-program-details">
      <div className="result-program-details-box">{title}</div>
      <div className="result-program-details-box">
        <strong>{value}</strong>
      </div>
    </div>
  );
}

type ResultsCardFlag = {
  text: FormattedMessageType;
  className: string;
};

type EligibleMemberTag = {
  label: FormattedMessageType;
};

type ResultsCardProps = {
  name: FormattedMessageType;
  detail1: ResultsCardDetail;
  detail2?: ResultsCardDetail;
  link: string;
  flags?: ResultsCardFlag[];
  containerClassNames?: string[];
  eligibleMembers?: EligibleMemberTag[];
};

function EligibleMemberTags({ members }: { members: EligibleMemberTag[] }) {
  if (members.length === 0) {
    return null;
  }

  return (
    <div className="eligible-members-container">
      <span className="eligible-members-label">
        <FormattedMessage id="programCard.eligible-label" defaultMessage="Eligible:" />
      </span>
      <div className="eligible-members-tags">
        {members.map((member, i) => (
          <span key={i} className="eligible-member-tag">
            {member.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ResultsCard({
  name,
  detail1,
  detail2,
  link,
  flags = [],
  containerClassNames = [],
  eligibleMembers = [],
}: ResultsCardProps) {
  // Mobile is below desktop breakpoint (0-767px)
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.desktop - 1}px)`);
  const containerClass = 'result-program-container ' + containerClassNames.join(' ');

  return (
    <div className={containerClass}>
      <div className="result-program-flags-container">
        {flags.map((flag, i) => {
          return (
            <div className={flag.className} key={i}>
              {flag.text}
            </div>
          );
        })}
      </div>
      {isMobile ? (
        <>
          <div className="result-program-mobile-header">
            <div className="result-program-more-info-wrapper">
              <div className="result-program-more-info">
                <Link to={link}>{name}</Link>
              </div>
              <div className="result-program-more-info-button">
                <Link to={link} data-testid="more-info-link">
                  <FormattedMessage id="more-info" defaultMessage="More Info" />
                </Link>
              </div>
            </div>
            <EligibleMemberTags members={eligibleMembers} />
          </div>
          <hr />
          <div className="result-program-details-wrapper">
            <ResultsCardDetail {...detail1} />
            {detail2 !== undefined && <ResultsCardDetail {...detail2} />}
          </div>
        </>
      ) : (
        <>
          <div className="result-program-header-row">
            <div className="result-program-more-info">
              <Link to={link}>{name}</Link>
            </div>
            <div className="result-program-more-info-button">
              <Link to={link} data-testid="more-info-link">
                <FormattedMessage id="more-info" defaultMessage="More Info" />
              </Link>
            </div>
          </div>
          <div className="result-program-details-row">
            <ResultsCardDetail {...detail1} />
            {detail2 !== undefined && <ResultsCardDetail {...detail2} />}
            <div className="result-program-details result-program-eligible-column">
              <EligibleMemberTags members={eligibleMembers} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type ProgramCardProps = {
  program: Program;
};

const ProgramCard = ({ program }: ProgramCardProps) => {
  const estimatedAppTime = program.estimated_application_time;
  const programName = program.name;
  const programId = program.program_id;
  const { validations, isAdminView } = useResultsContext();
  const { formData } = useContext(Context);
  const relationshipOptions = useConfig<{ [key: string]: FormattedMessageType }>('relationship_options');
  const showEligibilityTags = useFeatureFlag('eligibility_tags');

  const containerClass = useMemo(() => {
    const classNames = [];
    const validation = findValidationForProgram(validations, program);

    if (validation === undefined || !isAdminView) {
      return [];
    }

    const passed = Number(validation.value) === program.estimated_value && validation.eligible === program.eligible;

    if (passed) {
      classNames.push('passed');
    } else {
      classNames.push('failed');
    }

    return classNames;
  }, [isAdminView, validations]);

  const flags = useMemo(() => {
    const flags: ResultsCardFlag[] = [];

    if (program.new) {
      flags.push({
        text: <FormattedMessage id="results-new-benefit-flag" defaultMessage="New Benefit" />,
        className: 'new-program-flag',
      });
    }

    if (program.low_confidence) {
      flags.push({
        text: <FormattedMessage id="results-low-confidence-flag" defaultMessage="Low Confidence" />,
        className: 'low-confidence-flag',
      });
    }

    return flags;
  }, [program.new, program.low_confidence]);

  const eligibleMembers = useMemo(() => {
    if (!showEligibilityTags) {
      return [];
    }

    const totalMembers = formData.householdData.length;

    // Only show eligible member tags if household has more than 1 member
    if (totalMembers <= 1) {
      return [];
    }

    const eligibleMembersList = program.members.filter((m) => m.eligible);

    // If program is eligible but no individual members are marked eligible,
    // it's a household-level program (e.g. SNAP)
    if (program.eligible && eligibleMembersList.length === 0) {
      return [
        {
          label: <FormattedMessage id="programCard.household" defaultMessage="Household" />,
        },
      ];
    }

    // If no members are eligible (and program isn't eligible), show nothing
    if (eligibleMembersList.length === 0) {
      return [];
    }

    // Show individual eligible members (even if all are eligible)
    return eligibleMembersList.map((memberEligibility) => {
      const member = findMemberEligibilityMember(formData, memberEligibility);
      const memberIndex = formData.householdData.findIndex((m) => m.frontendId === member.frontendId);
      const age = calcAge(member);

      if (memberIndex === 0) {
        return {
          label: <FormattedMessage id="programCard.eligibleMember.you" defaultMessage="You" />,
        };
      }

      const relationOption = relationshipOptions[member.relationshipToHH];
      const relationshipLabel =
        relationOption && typeof relationOption === 'object' && 'props' in relationOption ? (
          <FormattedMessage {...relationOption.props} />
        ) : (
          member.relationshipToHH
        );

      return {
        label: (
          <FormattedMessage
            id="programCard.eligibleMember"
            defaultMessage="{relationship}, {age}"
            values={{
              relationship: relationshipLabel,
              age,
            }}
          />
        ),
      };
    });
  }, [program.members, program.eligible, formData, relationshipOptions, showEligibilityTags]);

  const programPageLink = useResultsLink(`results/benefits/${programId}`);
  const value = useFormatDisplayValue(program);

  return (
    <ResultsCard
      name={<ResultsTranslate translation={programName} />}
      detail1={{
        title: <FormattedMessage id="results.estimated_application_time" defaultMessage="Application Time: " />,
        value: <ResultsTranslate translation={estimatedAppTime} />,
      }}
      detail2={{
        title: <FormattedMessage id="program-card.estimated-savings" defaultMessage="Estimated Savings: " />,
        value: value,
      }}
      flags={flags}
      link={programPageLink}
      containerClassNames={containerClass}
      eligibleMembers={eligibleMembers}
    />
  );
};

export default ProgramCard;
