import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatToUSD } from '../FormattedValue';
import { useTranslateNumber } from '../../../Assets/languageOptions';

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

  // Calculate the position of the estimated value within the range (0-100)
  const range = upperValue - lowerValue;
  const position = range > 0 ? ((estimatedValue - lowerValue) / range) * 100 : 50;

  // Ensure position is within bounds
  const normalizedPosition = Math.max(0, Math.min(100, position));

  // Create gauge segments
  // The gauge will be a semicircle (180 degrees) divided into segments
  const gaugeData = [
    { name: 'filled', value: normalizedPosition, color: getGaugeColor(normalizedPosition) },
    { name: 'empty', value: 100 - normalizedPosition, color: '#e9ecef' },
  ];

  // Add a small indicator segment at the estimated value position
  const indicatorData = [
    { name: 'before', value: normalizedPosition, color: 'transparent' },
    { name: 'indicator', value: 2, color: '#2c3e50' }, // Small indicator
    { name: 'after', value: 98 - normalizedPosition, color: 'transparent' },
  ];

  const formattedValue = translateNumber(formatToUSD(estimatedValue));
  const formattedLower = translateNumber(formatToUSD(lowerValue));
  const formattedUpper = translateNumber(formatToUSD(upperValue));

  return (
    <div
      className={`radial-gauge ${className}`}
      role="img"
      aria-label={`Lifetime benefit value gauge showing ${formattedValue} estimated value within range of ${formattedLower} to ${formattedUpper}, with ${getRiskText(
        riskLevel,
      ).toLowerCase()} confidence level`}
    >
      <div className="gauge-container">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            {/* Main gauge arc */}
            <Pie
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
                <Cell key={`gauge-${index}`} fill={entry.color} />
              ))}
            </Pie>

            {/* Indicator needle */}
            <Pie
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
                <Cell key={`indicator-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center value display */}
        <div className="gauge-center" role="status" aria-live="polite">
          <div className="gauge-value" aria-label={`Primary estimated value: ${formattedValue}`}>
            {formattedValue}
          </div>
          <div className="gauge-label">Estimated Value</div>
        </div>

        {/* Range labels */}
        <div
          className="gauge-range-labels"
          role="note"
          aria-label={`Value range from ${formattedLower} minimum to ${formattedUpper} maximum`}
        >
          <span className="range-min" aria-label={`Minimum value: ${formattedLower}`}>
            {formattedLower}
          </span>
          <span className="range-max" aria-label={`Maximum value: ${formattedUpper}`}>
            {formattedUpper}
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
          positioned within a confidence range from {formattedLower} to {formattedUpper}. The estimated value represents{' '}
          {normalizedPosition.toFixed(0)}% through the confidence range. This projection has a{' '}
          {getRiskText(riskLevel).toLowerCase()} confidence level.
        </div>
      </div>
    </div>
  );
};

// Helper function to get gauge color based on position
function getGaugeColor(position: number): string {
  if (position <= 33) {
    return '#dc3545'; // Red for lower third
  } else if (position <= 66) {
    return '#ffc107'; // Yellow for middle third
  } else {
    return '#28a745'; // Green for upper third
  }
}

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
