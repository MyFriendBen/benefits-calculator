import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import EnergyCalculatorRebatePage from './RebatePage';
import { Context } from '../../Wrapper/Wrapper';
import { useFeatureFlag } from '../../Config/configHook';
import { useResultsLink } from '../../Results/Results';
import type { EnergyCalculatorRebateCategory, EnergyCalculatorRebateCategoryType } from './rebateTypes';

jest.mock('../../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('../../Results/Results', () => ({
  useResultsLink: jest.fn(),
}));

// HeatPumpJourneyCards is exercised in its own test file; stub here to keep this
// test focused on RebatePage's conditional layout logic.
jest.mock('./HeatPumpJourney', () => ({
  HeatPumpJourneyCards: () => <div data-testid="heat-pump-journey-cards" />,
}));

// renderCategoryDescription pulls in formData; stub to a no-op for these tests.
jest.mock('./rebateTypes', () => {
  const actual = jest.requireActual('./rebateTypes');
  return {
    ...actual,
    renderCategoryDescription: () => null,
  };
});

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const mockUseResultsLink = useResultsLink as jest.MockedFunction<typeof useResultsLink>;

const buildCategory = (type: EnergyCalculatorRebateCategoryType): EnergyCalculatorRebateCategory => ({
  type,
  name: 'Category Name' as unknown as EnergyCalculatorRebateCategory['name'],
  rebates: [],
});

const renderPage = (type: EnergyCalculatorRebateCategoryType) =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <MemoryRouter>
        <Context.Provider value={{ formData: {} } as any}>
          <EnergyCalculatorRebatePage rebateCategory={buildCategory(type)} />
        </Context.Provider>
      </MemoryRouter>
    </IntlProvider>,
  );

describe('EnergyCalculatorRebatePage heat pump journey gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResultsLink.mockImplementation((link: string) => `/co/test-uuid/${link}`);
  });

  it('does not render the heat pump journey when the feature flag is off (hvac category)', () => {
    mockUseFeatureFlag.mockReturnValue(false);

    renderPage('hvac');

    expect(screen.queryByTestId('heat-pump-journey-cards')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /rebates/i, level: 2 })).not.toBeInTheDocument();
  });

  it('does not render the heat pump journey for non-hvac categories even when the flag is on', () => {
    mockUseFeatureFlag.mockReturnValue(true);

    renderPage('waterHeater');

    expect(screen.queryByTestId('heat-pump-journey-cards')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /rebates/i, level: 2 })).not.toBeInTheDocument();
  });

  it('renders the heat pump journey and Rebates heading for the hvac category when the flag is on', () => {
    mockUseFeatureFlag.mockReturnValue(true);

    renderPage('hvac');

    expect(screen.getByTestId('heat-pump-journey-cards')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /rebates/i, level: 2 })).toBeInTheDocument();
  });
});
