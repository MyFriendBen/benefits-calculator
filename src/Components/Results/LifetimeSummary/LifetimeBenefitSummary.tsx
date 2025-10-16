import React, { useState } from 'react';
import { LifetimeProjectionSummary } from '../../../Types/Results';
import { formatToUSD } from '../FormattedValue';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { FormattedMessage } from 'react-intl';
import './LifetimeBenefitSummary.css';

interface LifetimeBenefitSummaryProps {
  summary: LifetimeProjectionSummary;
  className?: string;
}

const LifetimeBenefitSummary: React.FC<LifetimeBenefitSummaryProps> = ({ summary, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const translateNumber = useTranslateNumber();

  const formattedLifetimeValue = translateNumber(formatToUSD(summary.total_estimated_lifetime_value));
  const formattedLowerValue = translateNumber(formatToUSD(summary.total_lifetime_range.lower_value));
  const formattedUpperValue = translateNumber(formatToUSD(summary.total_lifetime_range.upper_value));
  const formattedDuration = translateNumber(Math.round(summary.average_benefit_duration_months).toString());

  return (
    <section className={`lifetime-summary-section ${className}`}>
      <div className="lifetime-summary-card">
        <div className="lifetime-summary-header">
          <h2 className="lifetime-summary-title">
            <FormattedMessage
              id="lifetime-summary.title"
              defaultMessage="Your Total Long-term Benefit Value"
            />
          </h2>
          <div className="lifetime-summary-confidence">
            <span className={`confidence-indicator confidence-${summary.confidence_level}`}>
              <FormattedMessage
                id={`lifetime-summary.confidence.${summary.confidence_level}`}
                defaultMessage={summary.confidence_level}
              />
            </span>
          </div>
        </div>

        <div className="lifetime-summary-values">
          <div className="total-lifetime-value">
            <span className="lifetime-value-amount">{formattedLifetimeValue}</span>
            <span className="lifetime-value-label">
              <FormattedMessage
                id="lifetime-summary.total-value-label"
                defaultMessage="Estimated total lifetime value"
              />
            </span>
          </div>

          <div className="confidence-range">
            <FormattedMessage
              id="lifetime-summary.range"
              defaultMessage="Range: {lowerValue} - {upperValue}"
              values={{
                lowerValue: formattedLowerValue,
                upperValue: formattedUpperValue,
              }}
            />
          </div>
        </div>

        <div className="lifetime-summary-description">
          <p className="primary-summary">{summary.display_text.primary_summary}</p>
        </div>

        <button
          className="methodology-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-controls="lifetime-methodology-details"
        >
          <FormattedMessage
            id={showDetails ? 'lifetime-summary.hide-details' : 'lifetime-summary.show-details'}
            defaultMessage={showDetails ? 'Hide details' : 'How we calculated this'}
          />
          <span className={`expand-icon ${showDetails ? 'expanded' : ''}`}>▼</span>
        </button>

        {showDetails && (
          <div id="lifetime-methodology-details" className="methodology-details">
            <div className="methodology-section">
              <h3>
                <FormattedMessage
                  id="lifetime-summary.methodology.title"
                  defaultMessage="Calculation Method"
                />
              </h3>
              <p>{summary.display_text.confidence_summary}</p>
              <p>{summary.display_text.duration_summary}</p>
            </div>

            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{summary.total_programs_with_projections}</span>
                <span className="stat-label">
                  <FormattedMessage
                    id="lifetime-summary.programs-count"
                    defaultMessage="Programs with projections"
                  />
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formattedDuration}</span>
                <span className="stat-label">
                  <FormattedMessage
                    id="lifetime-summary.average-duration"
                    defaultMessage="Average months of benefits"
                  />
                </span>
              </div>
            </div>

            <div className="disclaimer">
              <p>
                <FormattedMessage
                  id="lifetime-summary.disclaimer"
                  defaultMessage="These estimates are based on historical data and may vary based on your specific circumstances. Your actual benefit duration and value may differ."
                />
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default LifetimeBenefitSummary;