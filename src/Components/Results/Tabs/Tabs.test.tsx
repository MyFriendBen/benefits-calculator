import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import ResultsTabs from './Tabs';
import { ResultsTabId } from './buildTabs';

const mockTrack = jest.fn();

jest.mock('../Results', () => ({
  useResultsContext: () => ({ programs: [{}, {}, {}], needs: [{}, {}] }),
  useResultsLink: (link: string) => `/co/uuid/${link}`,
  useImmediateHelpSuppressed: () => false,
}));

jest.mock('../../EnergyCalculator/hooks', () => ({
  useIsEnergyCalculator: () => false,
}));

jest.mock('../../../Assets/analytics', () => ({
  useTrackEvent: () => mockTrack,
}));

const renderTabs = (activeTab: ResultsTabId = 'program') =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" defaultLocale="en">
        <ResultsTabs activeTab={activeTab} />
      </IntlProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  mockTrack.mockClear();
});

describe('ResultsTabs', () => {
  // The tablist/tab roles live on plain divs and anchors rather than a component that
  // supplies them, so assert the wiring screen readers depend on.
  it('exposes the row as a tablist of tabs', () => {
    renderTabs();

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('marks only the active tab as selected and points every tab at the panel', () => {
    renderTabs('need');

    const selected = screen.getAllByRole('tab', { selected: true });

    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAttribute('data-testid', 'near-term-benefits-tab');
    screen.getAllByRole('tab').forEach((tab) => {
      expect(tab).toHaveAttribute('aria-controls', 'results-tabpanel');
    });
  });

  // Roving tabindex: only the active tab is reachable by Tab, the rest by arrow keys.
  it('keeps just the active tab in the tab order', () => {
    renderTabs();

    expect(screen.getByTestId('long-term-benefits-tab')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('near-term-benefits-tab')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('immediate-help-tab')).toHaveAttribute('tabindex', '-1');
  });

  // The count is its own badge element, not a "(n)" suffix on the label, so assert the
  // element and its exact text rather than a substring the old form would also satisfy.
  it('counts results on the two result tabs and leaves Immediate Help uncounted', () => {
    renderTabs();

    const programBadge = screen.getByTestId('long-term-benefits-tab').querySelector('.results-tab-count');
    const needBadge = screen.getByTestId('near-term-benefits-tab').querySelector('.results-tab-count');

    expect(programBadge).toHaveTextContent(/^3$/);
    expect(needBadge).toHaveTextContent(/^2$/);
    expect(screen.getByTestId('immediate-help-tab').querySelector('.results-tab-count')).toBeNull();
  });

  it('reports the tab name to analytics on click', async () => {
    renderTabs();

    await userEvent.click(screen.getByTestId('near-term-benefits-tab'));

    expect(mockTrack).toHaveBeenCalledWith('screener_results_tab_click', { tab_name: 'additional_resources' });
  });

  // Immediate Help also fires the get-help event, so its rollup stays comparable with
  // the CESN button that leads to the same page.
  it('also reports a get-help click from the Immediate Help tab', async () => {
    renderTabs();

    await userEvent.click(screen.getByTestId('immediate-help-tab'));

    expect(mockTrack).toHaveBeenCalledWith('screener_results_tab_click', { tab_name: 'immediate_help' });
    expect(mockTrack).toHaveBeenCalledWith('screener_get_help_click', { location: 'immediate_help_tab' });
  });
});
