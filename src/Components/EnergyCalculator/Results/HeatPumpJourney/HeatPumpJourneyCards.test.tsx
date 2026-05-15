import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import HeatPumpJourneyCards from './HeatPumpJourneyCards';
import { useFeatureFlag } from '../../../Config/configHook';
import { useResultsLink } from '../../../Results/Results';

jest.mock('../../../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('../../../Results/Results', () => ({
  useResultsLink: jest.fn(),
}));

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockUseResultsLink = useResultsLink as jest.MockedFunction<typeof useResultsLink>;

const renderCards = () =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <MemoryRouter>
        <HeatPumpJourneyCards />
      </MemoryRouter>
    </IntlProvider>,
  );

describe('HeatPumpJourneyCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResultsLink.mockImplementation((link: string) => `/co/test-uuid/${link}`);
  });

  it('renders nothing when the cesn_heat_pump_journey feature flag is disabled', () => {
    mockUseFeatureFlag.mockReturnValue(false);

    const { container } = renderCards();

    expect(container).toBeEmptyDOMElement();
  });

  it('checks the cesn_heat_pump_journey feature flag', () => {
    mockUseFeatureFlag.mockReturnValue(false);

    renderCards();

    expect(mockUseFeatureFlag).toHaveBeenCalledWith('cesn_heat_pump_journey');
  });

  describe('when the feature flag is enabled', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true);
    });

    it('renders all three cards with titles', () => {
      renderCards();

      expect(screen.getByRole('heading', { name: /why get a heat pump\?/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /will it impact my bills\?/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /whom should i hire\?/i })).toBeInTheDocument();
    });

    it('renders the Learn more CTA pointing to Power Ahead Colorado in a new tab with utm_source', () => {
      renderCards();

      const learnMore = screen.getByRole('link', { name: /learn more/i });
      expect(learnMore).toHaveAttribute(
        'href',
        'https://poweraheadcolorado.org/why-heat-pumps?utm_source=cesn',
      );
      expect(learnMore).toHaveAttribute('target', '_blank');
      expect(learnMore).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('routes the Calculate impact CTA to the internal bills-impact path', () => {
      renderCards();

      const calculateImpact = screen.getByRole('link', { name: /calculate impact/i });
      expect(calculateImpact).toHaveAttribute('href', '/co/test-uuid/results/heat-pump-bills-impact');
    });

    it('routes the Connect now CTA to the internal contractors path', () => {
      renderCards();

      const connectNow = screen.getByRole('link', { name: /connect now/i });
      expect(connectNow).toHaveAttribute('href', '/co/test-uuid/results/heat-pump-contractors');
    });
  });
});
