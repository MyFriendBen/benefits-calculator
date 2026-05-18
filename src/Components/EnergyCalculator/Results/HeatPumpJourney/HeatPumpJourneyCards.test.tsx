import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import HeatPumpJourneyCards from './HeatPumpJourneyCards';
import { useResultsLink } from '../../../Results/Results';
import dataLayerPush from '../../../../Assets/analytics';

jest.mock('../../../Results/Results', () => ({
  useResultsLink: jest.fn(),
}));

jest.mock('../../../../Assets/analytics', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseResultsLink = useResultsLink as jest.MockedFunction<typeof useResultsLink>;
const mockDataLayerPush = dataLayerPush as jest.MockedFunction<typeof dataLayerPush>;

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

  describe('rendering', () => {
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

    it('exposes the section with an accessible label', () => {
      renderCards();

      expect(screen.getByRole('region', { name: /heat pump journey/i })).toBeInTheDocument();
    });

    it('fires the heat_pump_journey_learn_more_click analytics event when Learn more is clicked', () => {
      renderCards();

      fireEvent.click(screen.getByRole('link', { name: /learn more/i }));

      expect(mockDataLayerPush).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'outbound_click',
          action: 'heat_pump_journey_learn_more_click',
          category: 'heat_pump_journey',
          label: 'Power Ahead Colorado - Why Heat Pumps',
          url: 'https://poweraheadcolorado.org/why-heat-pumps?utm_source=cesn',
        }),
      );
    });
  });
});
