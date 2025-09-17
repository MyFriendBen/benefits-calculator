import { Link } from 'react-router-dom';
import { Program } from '../../../Types/Results';
import { FormattedMessage } from 'react-intl';
import { useFormatDisplayValue } from '../FormattedValue';
import ResultsTranslate from '../Translate/Translate';
import { useEffect, useMemo, useState } from 'react';
import './ProgramCard.css';
import { findValidationForProgram, useResultsContext, useResultsLink } from '../Results';
import { FormattedMessageType } from '../../../Types/Questions';

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

type ResultsCardProps = {
  name: FormattedMessageType;
  detail1: ResultsCardDetail;
  detail2?: ResultsCardDetail;
  link: string;
  flags?: ResultsCardFlag[];
  containerClassNames?: string[];
};

export function ResultsCard({ name, detail1, detail2, link, flags = [], containerClassNames = [] }: ResultsCardProps) {
  const windowWidth = window.innerWidth;
  const [size, setSize] = useState(windowWidth);

  useEffect(() => {
    function handleResize() {
      setSize(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = size < 775 ? true : false;

  type ConditonalWrapperProps = {
    children: React.ReactElement;
    condition: boolean;
    wrapper: (children: React.ReactElement) => JSX.Element;
  };
  const ConditonalWrapper: React.FC<ConditonalWrapperProps> = ({ condition, wrapper, children }) => {
    if (condition) {
      return wrapper(children);
    }

    return children;
  };

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
      <ConditonalWrapper
        condition={isMobile}
        wrapper={(children) => <div className="result-program-more-info-wrapper">{children}</div>}
      >
        <>
          <div className="result-program-more-info">
            <Link to={link}>{name}</Link>
          </div>
          {isMobile && (
            <div className="result-program-more-info-button">
              <Link to={link} data-testid="more-info-link">
                <FormattedMessage id="more-info" defaultMessage="More Info" />
              </Link>
            </div>
          )}
        </>
      </ConditonalWrapper>
      <hr />
      <div className="result-program-details-wrapper">
        <ResultsCardDetail {...detail1} />
        {detail2 !== undefined && <ResultsCardDetail {...detail2} />}
      </div>
      {!isMobile && (
        <div className="result-program-more-info-button">
          <Link to={link} data-testid="more-info-link">
            <FormattedMessage id="more-info" defaultMessage="More Info" />
          </Link>
        </div>
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
  }, []);

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
    />
  );
};

export default ProgramCard;
