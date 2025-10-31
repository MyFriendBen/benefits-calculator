import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import LifetimeBenefitSummary from './LifetimeBenefitSummary';
import { LifetimeProjectionSummary } from '../../../Types/Results';

// Mock the entire FormattedValue module to avoid dependency issues
jest.mock('../FormattedValue', () => ({
  formatToUSD: (num: number) => `$${num.toLocaleString()}`,
}));

// Mock the useTranslateNumber hook
jest.mock('../../../Assets/languageOptions', () => ({
  useTranslateNumber: () => (value: string) => value,
}));

const mockSummary: LifetimeProjectionSummary = {
  total_estimated_lifetime_value: 15000,
  total_lifetime_range: {
    lower_value: 12000,
    upper_value: 18000,
  },
  average_benefit_duration_months: 24,
  total_programs_with_projections: 3,
  confidence_level: 'moderate',
  display_text: {
    primary_summary: 'Based on historical data, your total lifetime benefit value is estimated at $15,000',
    confidence_summary: 'This estimate could range from $12,000 to $18,000 depending on individual circumstances',
    duration_summary: 'Benefits typically last an average of 24 months across all programs',
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('LifetimeBenefitSummary', () => {
  test('renders summary with correct values', () => {
    renderWithIntl(<LifetimeBenefitSummary summary={mockSummary} />);

    // Check main lifetime value
    expect(screen.getByText('$15,000')).toBeInTheDocument();

    // Check primary summary text
    expect(screen.getByText(mockSummary.display_text.primary_summary)).toBeInTheDocument();
  });

  test('shows details when toggle button is clicked', () => {
    renderWithIntl(<LifetimeBenefitSummary summary={mockSummary} />);

    // Initially, details should be hidden
    expect(screen.queryByText(mockSummary.display_text.confidence_summary)).not.toBeInTheDocument();

    // Click the toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Details should now be visible
    expect(screen.getByText(mockSummary.display_text.confidence_summary)).toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    const { container } = renderWithIntl(
      <LifetimeBenefitSummary summary={mockSummary} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('lifetime-summary-section', 'custom-class');
  });
});