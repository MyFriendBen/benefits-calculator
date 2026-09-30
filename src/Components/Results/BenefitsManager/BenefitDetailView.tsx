import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Program } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { useFormatDisplayValue } from '../FormattedValue';
import { formatPhoneNumber } from '../helpers';

type BenefitDetailViewProps = {
  program: Program;
  onClose: () => void;
  highlightApplicationProcess?: boolean;
};

// Real program data where the program has it — the same fields the program page shows —
// so the demo stays on this page instead of navigating away and back.
const BenefitDetailView = ({ program, onClose, highlightApplicationProcess = false }: BenefitDetailViewProps) => {
  const value = useFormatDisplayValue(program);
  const { formatMessage } = useIntl();

  const translate = (t: { label: string; default_message: string }) =>
    t.default_message === '' ? '' : formatMessage({ id: t.label, defaultMessage: t.default_message });

  const applyLink = translate(program.apply_button_link);
  const learnMoreLink = translate(program.learn_more_link);
  const phone = program.navigators.find((navigator) => navigator.phone_number)?.phone_number;
  // The short description keeps this a quick view; the full one lives on the program page.
  const description =
    program.description_short.default_message !== '' ? program.description_short : program.description;

  // "Find out how to apply" opens this scrolled to the application section.
  const applicationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlightApplicationProcess) {
      applicationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightApplicationProcess]);

  return (
    <div className="benefit-detail-overlay" onClick={onClose}>
      <div
        className="benefit-detail-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={formatMessage({ id: 'benefitDetail.ariaLabel', defaultMessage: 'Benefit details' })}
      >
        <button
          type="button"
          className="benefit-detail-close"
          onClick={onClose}
          aria-label={formatMessage({ id: 'benefitDetail.close', defaultMessage: 'Close' })}
        >
          <CloseIcon />
        </button>

        <div className="benefit-detail-header">
          <h2 className="benefit-detail-title">
            <ResultsTranslate translation={program.name} />
          </h2>
        </div>

        <div className="benefit-detail-meta">
          {learnMoreLink !== '' && (
            <div className="benefit-detail-meta-item">
              <LanguageIcon fontSize="small" />
              <a href={learnMoreLink} target="_blank" rel="noopener noreferrer" className="benefit-detail-link">
                <FormattedMessage id="benefitDetail.learnMore" defaultMessage="Learn more" />
              </a>
            </div>
          )}
          {phone !== undefined && (
            <div className="benefit-detail-meta-item">
              <PhoneIcon fontSize="small" />
              <a href={`tel:${phone}`} className="benefit-detail-link">
                {formatPhoneNumber(phone)}
              </a>
            </div>
          )}
          <div className="benefit-detail-savings">
            <span className="benefit-detail-savings-label">
              <FormattedMessage id="benefitDetail.estimatedSavings" defaultMessage="Estimated Savings" />
            </span>
            <span className="benefit-detail-savings-value">{value}</span>
          </div>
          <div className="benefit-detail-facts">
            <div className="benefit-detail-fact">
              <span className="benefit-detail-fact-label">
                <FormattedMessage id="benefitDetail.timeToApply" defaultMessage="Time to apply" />
              </span>
              <span className="benefit-detail-fact-value">
                <ResultsTranslate translation={program.estimated_application_time} />
              </span>
            </div>
            <div className="benefit-detail-fact">
              <span className="benefit-detail-fact-label">
                <FormattedMessage id="benefitDetail.timeToReceive" defaultMessage="Time to receive" />
              </span>
              <span className="benefit-detail-fact-value">
                <ResultsTranslate translation={program.estimated_delivery_time} />
              </span>
            </div>
          </div>
        </div>

        <div className="benefit-detail-sections">
          <div className="benefit-detail-section">
            <h3 className="benefit-detail-section-title">
              <FormattedMessage id="benefitDetail.description" defaultMessage="Description" />
            </h3>
            <p className="benefit-detail-section-body">
              <ResultsTranslate translation={description} />
            </p>
          </div>

          <div
            ref={applicationRef}
            className={`benefit-detail-section${highlightApplicationProcess ? ' benefit-detail-section-highlight' : ''}`}
          >
            <h3 className="benefit-detail-section-title">
              <FormattedMessage id="benefitDetail.applicationProcess" defaultMessage="Application Process" />
            </h3>
            {applyLink !== '' ? (
              <a href={applyLink} target="_blank" rel="noopener noreferrer" className="benefit-detail-apply-link">
                {program.apply_button_description.default_message !== '' ? (
                  <ResultsTranslate translation={program.apply_button_description} />
                ) : (
                  <FormattedMessage id="results.apply-online" defaultMessage="Apply Online" />
                )}
                <OpenInNewIcon fontSize="small" />
              </a>
            ) : (
              <p className="benefit-detail-section-body">
                <FormattedMessage
                  id="benefitDetail.autoEnrolled"
                  defaultMessage="No application needed — you'll be enrolled automatically."
                />
              </p>
            )}

            {program.documents.length > 0 && (
              <>
                <h4 className="benefit-detail-subheading">
                  <FormattedMessage id="benefitDetail.documents" defaultMessage="Documents to have ready" />
                </h4>
                <ul className="benefit-detail-list">
                  {program.documents.map((document, index) => (
                    <li key={index}>
                      <ResultsTranslate translation={document.text} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {program.navigators.length > 0 && (
              <>
                <h4 className="benefit-detail-subheading">
                  <FormattedMessage id="benefitDetail.navigators" defaultMessage="Get help applying" />
                </h4>
                <ul className="benefit-detail-list">
                  {program.navigators.map((navigator) => (
                    <li key={navigator.id}>
                      <strong>
                        <ResultsTranslate translation={navigator.name} />
                      </strong>
                      {navigator.phone_number && <> · {formatPhoneNumber(navigator.phone_number)}</>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="benefit-detail-footer">
          <button type="button" className="benefit-detail-apply-btn" onClick={onClose}>
            <FormattedMessage id="benefitDetail.gotIt" defaultMessage="Got It" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BenefitDetailView;
