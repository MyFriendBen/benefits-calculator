import React, { useState } from 'react';
import { LifetimeProjection } from '../../../Types/Results';
import { formatToUSD } from '../FormattedValue';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { FormattedMessage } from 'react-intl';
import RadialGauge from './RadialGauge';
import './LifetimeBenefitSummary.css';

interface DetailedLifetimeProjectionDisplayProps {
  projection: LifetimeProjection;
  className?: string;
}

const DetailedLifetimeProjectionDisplay: React.FC<DetailedLifetimeProjectionDisplayProps> = ({
  projection,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const translateNumber = useTranslateNumber();

  const formattedLifetimeValue = translateNumber(formatToUSD(projection.estimated_lifetime_value));
  const formattedLowerValue = translateNumber(formatToUSD(projection.lifetime_value_range.lower_value));
  const formattedUpperValue = translateNumber(formatToUSD(projection.lifetime_value_range.upper_value));
  const formattedDuration = translateNumber(Math.round(projection.estimated_duration_months).toString());
  const formattedConfidenceLevel = Math.round(projection.confidence_interval.confidence_level * 100);

  // Don't show if display config indicates it shouldn't be displayed
  if (!projection.display_config.should_display) {
    return null;
  }

  return (
    <section className={`lifetime-summary-section ${className}`}>
      <div className="lifetime-summary-card">
        <div className="lifetime-summary-header">
          <h2 className="lifetime-summary-title">
            {projection.display_config.section_title || (
              <FormattedMessage
                id="detailed-lifetime-projection.title"
                defaultMessage="Long-term Benefit Value for This Program"
              />
            )}
          </h2>
        </div>

        <div className="lifetime-summary-with-gauge">
          <div className="lifetime-values-section">
            <div className="confidence-range">
              <FormattedMessage
                id="detailed-lifetime-projection.range"
                defaultMessage="Range: {lowerValue} - {upperValue}"
                values={{
                  lowerValue: formattedLowerValue,
                  upperValue: formattedUpperValue,
                }}
              />
            </div>

            <div className="duration-info">
              <FormattedMessage
                id="detailed-lifetime-projection.duration"
                defaultMessage="Estimated duration: {duration} months"
                values={{
                  duration: formattedDuration,
                }}
              />
            </div>
          </div>

          <div className="gauge-section">
            <RadialGauge
              estimatedValue={projection.estimated_lifetime_value}
              lowerValue={projection.lifetime_value_range.lower_value}
              upperValue={projection.lifetime_value_range.upper_value}
              riskLevel={projection.risk_assessment.risk_level}
            />
          </div>
        </div>

        <div className="lifetime-summary-description">
          <p className="primary-summary">{projection.explanation.summary}</p>
        </div>

        <button
          className="methodology-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-controls="detailed-lifetime-methodology"
          data-testid="detailed-lifetime-toggle"
        >
          <FormattedMessage
            id={showDetails ? 'detailed-lifetime-projection.hide-details' : 'detailed-lifetime-projection.show-details'}
            defaultMessage={showDetails ? 'Hide details' : 'How we calculated this'}
          />
          <span className={`expand-icon ${showDetails ? 'expanded' : ''}`}>▼</span>
        </button>

        {showDetails && (
          <div id="detailed-lifetime-methodology" className="methodology-details">
            <div className="methodology-section">
              <h3>
                <FormattedMessage
                  id="detailed-lifetime-projection.methodology.title"
                  defaultMessage="Calculation Method"
                />
              </h3>
              <p>{projection.explanation.detailed_explanation}</p>
              {projection.explanation.methodology_explanation && (
                <p>{projection.explanation.methodology_explanation}</p>
              )}
            </div>

            <div className="methodology-section">
              <h4>
                <FormattedMessage
                  id="detailed-lifetime-projection.factors.title"
                  defaultMessage="Factors Affecting Duration"
                />
              </h4>
              <ul>
                {projection.explanation.factors_affecting_duration.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
                {projection.explanation.program_specific_factors?.map((factor, index) => (
                  <li key={`program-${index}`}>{factor}</li>
                ))}
              </ul>
            </div>

            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{formattedConfidenceLevel}%</span>
                <span className="stat-label">
                  <FormattedMessage
                    id="detailed-lifetime-projection.confidence-level"
                    defaultMessage="Confidence level"
                  />
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formattedDuration}</span>
                <span className="stat-label">
                  <FormattedMessage
                    id="detailed-lifetime-projection.duration-months"
                    defaultMessage="Estimated months"
                  />
                </span>
              </div>
            </div>

            <div className="risk-assessment">
              <h4>
                <FormattedMessage
                  id="detailed-lifetime-projection.risk-assessment.title"
                  defaultMessage="Accuracy Assessment"
                />
              </h4>
              <p>{projection.risk_assessment.confidence_notes}</p>
              {projection.risk_assessment.risk_factors.length > 0 && (
                <div>
                  <h5>
                    <FormattedMessage
                      id="detailed-lifetime-projection.risk-factors.title"
                      defaultMessage="Factors that may affect accuracy:"
                    />
                  </h5>
                  <ul>
                    {projection.risk_assessment.risk_factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {projection.research_validation && (
              <div className="research-validation">
                <h4>
                  <FormattedMessage id="detailed-lifetime-projection.research.title" defaultMessage="Research Basis" />
                </h4>
                <p>{projection.research_validation.confidence_validation}</p>
                <p className="data-source">
                  <FormattedMessage
                    id="detailed-lifetime-projection.data-source"
                    defaultMessage="Primary source: {source}"
                    values={{
                      source: projection.research_validation.primary_source,
                    }}
                  />
                </p>
              </div>
            )}

            <div className="disclaimer">
              <p>
                <FormattedMessage
                  id="detailed-lifetime-projection.disclaimer"
                  defaultMessage="These estimates are based on historical data and may vary based on your specific circumstances. Your actual benefit duration and value may differ. This projection is specific to this program only."
                />
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DetailedLifetimeProjectionDisplay;
