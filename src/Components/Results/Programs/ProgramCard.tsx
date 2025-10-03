import { Link } from 'react-router-dom';
import { Program, LifetimeProjection } from '../../../Types/Results';
import { FormattedMessage } from 'react-intl';
import { useFormatDisplayValue, formatToUSD } from '../FormattedValue';
import ResultsTranslate from '../Translate/Translate';
import { useEffect, useMemo, useState } from 'react';
import './ProgramCard.css';
import { findValidationForProgram, useResultsContext, useResultsLink } from '../Results';
import { FormattedMessageType } from '../../../Types/Questions';
import { useTranslateNumber } from '../../../Assets/languageOptions';

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

function LifetimePreviewSection({ lifetimeValue, duration, confidenceLevel }: LifetimePreviewData) {
  const translateNumber = useTranslateNumber();
  const formattedValue = translateNumber(formatToUSD(lifetimeValue));
  const formattedDuration = translateNumber(Math.round(duration).toString());

  return (
    <div className="lifetime-preview-section">
      <hr className="lifetime-preview-divider" />
      <div className="lifetime-preview-content">
        <div className="lifetime-preview-header">
          <span className="lifetime-preview-label">
            <FormattedMessage
              id="program-card.lifetime-preview.label"
              defaultMessage="Long-term value:"
            />
          </span>
          <span className={`confidence-badge confidence-${confidenceLevel}`}>
            <FormattedMessage
              id={`program-card.confidence.${confidenceLevel}`}
              defaultMessage={confidenceLevel}
            />
          </span>
        </div>
        <div className="lifetime-preview-values">
          <span className="lifetime-value">{formattedValue}</span>
          <span className="duration-hint">
            <FormattedMessage
              id="program-card.lifetime-preview.duration"
              defaultMessage="(typically {duration} months)"
              values={{ duration: formattedDuration }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

type ResultsCardFlag = {
  text: FormattedMessageType;
  className: string;
};

type LifetimePreviewData = {
  lifetimeValue: number;
  duration: number;
  confidenceLevel: 'low' | 'moderate' | 'high';
};

type ResultsCardProps = {
  name: FormattedMessageType;
  detail1: ResultsCardDetail;
  detail2?: ResultsCardDetail;
  link: string;
  flags?: ResultsCardFlag[];
  containerClassNames?: string[];
  lifetimePreview?: LifetimePreviewData;
};

export function ResultsCard({ name, detail1, detail2, link, flags = [], containerClassNames = [], lifetimePreview }: ResultsCardProps) {
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
      {lifetimePreview && <LifetimePreviewSection {...lifetimePreview} />}
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
  lifetimeData?: LifetimeProjection;
};

const ProgramCard = ({ program, lifetimeData }: ProgramCardProps) => {
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

  // Create lifetime preview data if available
  const lifetimePreview = useMemo(() => {
    if (!lifetimeData) return undefined;

    return {
      lifetimeValue: lifetimeData.estimated_lifetime_value,
      duration: lifetimeData.estimated_duration_months,
      confidenceLevel: lifetimeData.risk_assessment.risk_level,
    };
  }, [lifetimeData]);

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
      lifetimePreview={lifetimePreview}
    />
  );
};

export default ProgramCard;
