import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import DetailedLifetimeProjectionDisplay from './DetailedLifetimeProjectionDisplay';
import { LifetimeProjection } from '../../../Types/Results';

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

const mockProjection: LifetimeProjection = {
  program_id: '123',
  prediction_id: 'pred-456',
  calculation_date: '2024-01-01',
  estimated_duration_months: 24,
  confidence_interval: {
    lower_months: 18,
    upper_months: 30,
    confidence_level: 0.85,
  },
  estimated_lifetime_value: 50000,
  lifetime_value_range: {
    lower_value: 40000,
    upper_value: 60000,
  },
  calculation_method: 'historical_analysis',
  multiplier_version: '1.2',
  data_source: 'state_data',
  explanation: {
    summary: 'This program typically provides benefits for 2 years.',
    detailed_explanation: 'Based on historical data analysis...',
    methodology_explanation: 'We used statistical modeling...',
    factors_affecting_duration: ['Employment changes', 'Income fluctuations'],
    program_specific_factors: ['Program enrollment capacity'],
  },
  risk_assessment: {
    risk_level: 'moderate',
    risk_factors: ['Economic conditions', 'Policy changes'],
    confidence_notes: 'Moderate confidence based on 5 years of data',
    accuracy_indicators: {
      data_quality: 'high',
      sample_size: 1000,
      last_validation: '2024-01-01',
    },
  },
  research_validation: {
    primary_source: 'State Department of Social Services',
    supporting_sources: ['Federal program data'],
    confidence_validation: 'Validated against federal statistics',
  },
  display_config: {
    should_display: true,
    section_priority: 1,
    collapsible: true,
    default_expanded: false,
    show_detailed_methodology: true,
    section_title: 'Long-term Value Projection',
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('DetailedLifetimeProjectionDisplay', () => {
  it('renders the component with basic information', () => {
    renderWithIntl(<DetailedLifetimeProjectionDisplay projection={mockProjection} />);

    expect(screen.getByText('Long-term Value Projection')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument(); // Only in gauge center now
    expect(screen.getByText(/Range: \$40,000 - \$60,000/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated duration: 24 months/)).toBeInTheDocument();
  });

  it('shows and hides details when toggle button is clicked', () => {
    renderWithIntl(<DetailedLifetimeProjectionDisplay projection={mockProjection} />);

    const toggleButton = screen.getByTestId('detailed-lifetime-toggle');

    // Details should be hidden initially
    expect(screen.queryByText('Calculation Method')).not.toBeInTheDocument();

    // Click to show details
    fireEvent.click(toggleButton);

    // Details should now be visible
    expect(screen.getByText('Calculation Method')).toBeInTheDocument();
    expect(screen.getByText('Based on historical data analysis...')).toBeInTheDocument();
    expect(screen.getByText('Factors Affecting Duration')).toBeInTheDocument();

    // Click to hide details
    fireEvent.click(toggleButton);

    // Details should be hidden again
    expect(screen.queryByText('Calculation Method')).not.toBeInTheDocument();
  });

  it('does not render when display_config.should_display is false', () => {
    const hiddenProjection = {
      ...mockProjection,
      display_config: {
        ...mockProjection.display_config,
        should_display: false,
      },
    };

    const { container } = renderWithIntl(
      <DetailedLifetimeProjectionDisplay projection={hiddenProjection} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays risk assessment information when details are expanded', () => {
    renderWithIntl(<DetailedLifetimeProjectionDisplay projection={mockProjection} />);

    const toggleButton = screen.getByTestId('detailed-lifetime-toggle');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Accuracy Assessment')).toBeInTheDocument();
    expect(screen.getByText('Moderate confidence based on 5 years of data')).toBeInTheDocument();
    expect(screen.getByText('Factors that may affect accuracy:')).toBeInTheDocument();
    expect(screen.getByText('Economic conditions')).toBeInTheDocument();
  });

  it('displays research validation when available', () => {
    renderWithIntl(<DetailedLifetimeProjectionDisplay projection={mockProjection} />);

    const toggleButton = screen.getByTestId('detailed-lifetime-toggle');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Research Basis')).toBeInTheDocument();
    expect(screen.getByText('Validated against federal statistics')).toBeInTheDocument();
    expect(screen.getByText(/Primary source: State Department of Social Services/)).toBeInTheDocument();
  });

  it('handles missing research validation gracefully', () => {
    const projectionWithoutResearch = {
      ...mockProjection,
      research_validation: undefined,
    };

    renderWithIntl(<DetailedLifetimeProjectionDisplay projection={projectionWithoutResearch} />);

    const toggleButton = screen.getByTestId('detailed-lifetime-toggle');
    fireEvent.click(toggleButton);

    expect(screen.queryByText('Research Basis')).not.toBeInTheDocument();
  });
});