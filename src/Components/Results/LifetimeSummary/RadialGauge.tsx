import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatToUSD } from '../FormattedValue';
import { useTranslateNumber } from '../../../Assets/languageOptions';

// Type fixes for Recharts compatibility
const ResponsiveContainerFixed = ResponsiveContainer as any;
const PieChartFixed = PieChart as any;
const PieFixed = Pie as any;
const CellFixed = Cell as any;

interface RadialGaugeProps {
  estimatedValue: number;
  lowerValue: number;
  upperValue: number;
  riskLevel: 'low' | 'moderate' | 'high';
  className?: string;
}

const RadialGauge: React.FC<RadialGaugeProps> = ({
  estimatedValue,
  lowerValue,
  upperValue,
  riskLevel,
  className = '',
}) => {
  const translateNumber = useTranslateNumber();

  // Calculate max value dynamically: if high end is at 66%, then max = upperValue / 0.66
  const maxValue = upperValue / 0.66;

  // Calculate positions on the new scale (0 to maxValue)
  const lowerPosition = (lowerValue / maxValue) * 100; // Should be ~33%
  const upperPosition = (upperValue / maxValue) * 100; // Should be ~66%
  const estimatedPosition = (estimatedValue / maxValue) * 100;

  // Create gauge segments with the range colored green and rest light gray
  const gaugeData = [
    // Light gray from start to lower range
    { name: 'before-range', value: lowerPosition, color: '#e9ecef' },
    // Green for the confidence range
    { name: 'range', value: upperPosition - lowerPosition, color: '#28a745' },
    // Light gray from upper range to end
    { name: 'after-range', value: 100 - upperPosition, color: '#e9ecef' },
  ];

  // Add a small indicator segment at the estimated value position
  const indicatorData = [
    { name: 'before', value: estimatedPosition, color: 'transparent' },
    { name: 'indicator', value: 2, color: '#2c3e50' }, // Small indicator
    { name: 'after', value: 98 - estimatedPosition, color: 'transparent' },
  ];

  const formattedValue = translateNumber(formatToUSD(estimatedValue));
  const formattedLower = translateNumber(formatToUSD(lowerValue));
  const formattedUpper = translateNumber(formatToUSD(upperValue));
  const formattedMin = translateNumber(formatToUSD(0));
  const formattedMax = translateNumber(formatToUSD(maxValue));

  return (
    <div
      className={`radial-gauge ${className}`}
      role="img"
      aria-label={`Lifetime benefit value gauge showing ${formattedValue} estimated value on a scale from ${formattedMin} to ${formattedMax}, with confidence range ${formattedLower} to ${formattedUpper} shown in green, and ${getRiskText(
        riskLevel,
      ).toLowerCase()} confidence level`}
    >
      <div className="gauge-container">
        <ResponsiveContainerFixed width="100%" height={200}>
          <PieChartFixed>
            {/* Main gauge arc */}
            <PieFixed
              data={gaugeData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              aria-hidden="true"
            >
              {gaugeData.map((entry, index) => (
                <CellFixed key={`gauge-${index}`} fill={entry.color} />
              ))}
            </PieFixed>

            {/* Indicator needle */}
            <PieFixed
              data={indicatorData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={85}
              paddingAngle={0}
              dataKey="value"
              aria-hidden="true"
            >
              {indicatorData.map((entry, index) => (
                <CellFixed key={`indicator-${index}`} fill={entry.color} />
              ))}
            </PieFixed>
          </PieChartFixed>
        </ResponsiveContainerFixed>

        {/* Center value display */}
        <div className="gauge-center" role="status" aria-live="polite">
          <div className="gauge-value" aria-label={`Primary estimated value: ${formattedValue}`}>
            {formattedValue}
          </div>
          <div className="gauge-label">Estimated Lifetime Value</div>
        </div>

        {/* Range labels */}
        <div
          className="gauge-range-labels"
          role="note"
          aria-label={`Gauge scale from ${formattedMin} to ${formattedMax}, with confidence range from ${formattedLower} to ${formattedUpper}`}
        >
          <span className="range-min" aria-label={`Scale minimum: ${formattedMin}`}>
            {formattedMin}
          </span>
          <span className="range-max" aria-label={`Scale maximum: ${formattedMax}`}>
            {formattedMax}
          </span>
        </div>

        {/* Risk level indicator */}
        <div
          className={`gauge-risk-indicator risk-${riskLevel}`}
          role="note"
          aria-label={`Confidence level: ${getRiskText(riskLevel)}`}
        >
          <div className="risk-dot" aria-hidden="true"></div>
          <span className="risk-text">{getRiskText(riskLevel)} Confidence</span>
        </div>

        {/* Screen reader-only detailed description */}
        <div className="sr-only">
          This gauge chart shows your estimated lifetime benefit value of {formattedValue}
          on a scale from {formattedMin} to {formattedMax}. The green section represents the confidence range from{' '}
          {formattedLower} to {formattedUpper}. The estimated value is positioned at {estimatedPosition.toFixed(0)}%
          through the full scale. This projection has a {getRiskText(riskLevel).toLowerCase()} confidence level.
        </div>
      </div>
    </div>
  );
};

// Helper function to get risk level text
function getRiskText(riskLevel: 'low' | 'moderate' | 'high'): string {
  switch (riskLevel) {
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'high':
      return 'High';
    default:
      return 'Moderate';
  }
}

export default RadialGauge;
