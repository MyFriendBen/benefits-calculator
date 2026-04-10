import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { FormattedMessage, useIntl } from 'react-intl';
import { Program } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { useFormatDisplayValue } from '../FormattedValue';

type BenefitDetailViewProps = {
  program: Program;
  onClose: () => void;
  highlightApplicationProcess?: boolean;
};

const BenefitDetailView = ({ program, onClose, highlightApplicationProcess = false }: BenefitDetailViewProps) => {
  const value = useFormatDisplayValue(program);
  const { formatMessage } = useIntl();

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
          <div className="benefit-detail-profile">
            <AccountCircleIcon style={{ fontSize: '3.5rem', color: 'var(--primary-color)' }} />
          </div>
          <h2 className="benefit-detail-title">
            <ResultsTranslate translation={program.name} />
          </h2>
        </div>

        <div className="benefit-detail-meta">
          <div className="benefit-detail-meta-item">
            <LanguageIcon fontSize="small" />
            <a href="https://example.com" target="_blank" rel="noopener noreferrer" className="benefit-detail-link">
              www.example.com
            </a>
          </div>
          <div className="benefit-detail-meta-item">
            <PhoneIcon fontSize="small" />
            <span>(303) 555-0100</span>
          </div>
          <div className="benefit-detail-savings">
            <span className="benefit-detail-savings-label">
              <FormattedMessage id="benefitDetail.estimatedSavings" defaultMessage="Estimated Savings" />
            </span>
            <span className="benefit-detail-savings-value">{value}</span>
          </div>
        </div>

        <div className="benefit-detail-sections">
          <div className="benefit-detail-section">
            <h3 className="benefit-detail-section-title">
              <FormattedMessage id="benefitDetail.description" defaultMessage="Description" />
            </h3>
            <p className="benefit-detail-section-body">
              <FormattedMessage
                id="benefitDetail.descriptionPlaceholder"
                defaultMessage="This program provides financial assistance to eligible individuals and families. Benefits are distributed monthly and can be used for qualifying expenses. Contact the administering agency for full eligibility details and to learn more about covered services."
              />
            </p>
          </div>

          <div className={`benefit-detail-section${highlightApplicationProcess ? ' benefit-detail-section-highlight' : ''}`}>
            <h3 className="benefit-detail-section-title">
              <FormattedMessage id="benefitDetail.applicationProcess" defaultMessage="Application Process" />
            </h3>
            <p className="benefit-detail-section-body">
              <FormattedMessage
                id="benefitDetail.applicationProcessPlaceholder"
                defaultMessage="You can apply online, by phone, or in person at your local office. You will need to provide proof of identity, income, and residency. Processing typically takes 30 days. A caseworker may contact you for an interview or to request additional documentation."
              />
            </p>
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
