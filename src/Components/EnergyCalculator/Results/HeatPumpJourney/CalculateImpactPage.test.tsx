import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CalculateImpactPage from './CalculateImpactPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../Common/usePageTitle', () => ({
  usePageTitle: jest.fn(),
}));

jest.mock('../../../Common/TrackedOutboundLink', () => ({
  TrackedOutboundLink: ({ children, href }) => <a href={href}>{children}</a>,
}));

jest.mock('../../Icons/Coin.svg', () => ({
  ReactComponent: () => <svg data-testid="coin-icon" />,
}));

jest.mock('../../../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('./fetchRemImpact', () => {
  class RemAddressNotSupportedError extends Error {
    constructor() {
      super('Address not supported');
      this.name = 'RemAddressNotSupportedError';
    }
  }
  return { fetchRemImpact: jest.fn(), RemAddressNotSupportedError };
});

const MOCK_RESULT = {
  bill_delta: {
    mean: { value: -19.76, unit: '$' },
    median: { value: -21.91, unit: '$' },
    percentile_20: { value: -60.52, unit: '$' },
    percentile_80: { value: 20.50, unit: '$' },
  },
  emissions_delta: {
    mean: { value: -1758.0, unit: 'lbCO2e' },
    median: { value: -1611.7, unit: 'lbCO2e' },
    percentile_20: { value: -2558.6, unit: 'lbCO2e' },
    percentile_80: { value: -950.0, unit: 'lbCO2e' },
  },
};

const renderPage = (route = '/cesn/test-uuid/results/energy-rebates/waterHeater/calculate-impact') =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/:whiteLabel/:uuid/results/energy-rebates/waterHeater/calculate-impact" element={<CalculateImpactPage />} />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );

const selectOption = async (selectElement: HTMLElement, optionText: string) => {
  fireEvent.mouseDown(selectElement);
  const listbox = await screen.findByRole('listbox');
  const option = within(listbox).getByText(new RegExp(`^${optionText}$`, 'i'));
  fireEvent.click(option);
};

describe('CalculateImpactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jest.requireMock('../../../Config/configHook').useFeatureFlag as jest.Mock).mockReturnValue(true);
    // Default: stays loading — most tests only exercise form state, not API results.
    (jest.requireMock('./fetchRemImpact').fetchRemImpact as jest.Mock).mockReturnValue(new Promise(() => {}));
  });

  describe('rendering', () => {
    it('renders the page header with Bill Impact Calculator title', () => {
      renderPage();
      expect(screen.getByText('Bill Impact Calculator')).toBeInTheDocument();
    });

    it('renders the Estimated Savings subtitle', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /estimated savings/i })).toBeInTheDocument();
    });

    it('renders the coin icon', () => {
      renderPage();
      expect(screen.getByTestId('coin-icon')).toBeInTheDocument();
    });

    it('renders the Rewiring America intro paragraph', () => {
      renderPage();
      expect(screen.getByText(/this data modeling is by/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /rewiring america/i })).toBeInTheDocument();
    });

    it('renders the BACK TO RESULTS button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('renders all form field labels', () => {
      renderPage();
      expect(screen.getByText('Household Type')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Heating Fuel')).toBeInTheDocument();
      expect(screen.getByLabelText(/water heating type/i)).toBeInTheDocument();
    });

    it('renders the Select upgrade section with the two non-weatherization options', () => {
      renderPage();
      expect(screen.getByText('Heat pump')).toBeInTheDocument();
      expect(screen.getByText('Heat pump water heater')).toBeInTheDocument();
      // Weatherization-based options were removed per CESN SME guidance.
      expect(screen.queryByText('Weatherization')).not.toBeInTheDocument();
      expect(screen.queryByText('Heat pump + weatherization')).not.toBeInTheDocument();
    });

    it('renders the Calculate impact submit button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /calculate impact/i })).toBeInTheDocument();
    });

    it('renders placeholder text in select fields on initial load', () => {
      renderPage();
      expect(screen.getByText('Select household type...')).toBeInTheDocument();
      expect(screen.getByText('Select heating fuel...')).toBeInTheDocument();
      expect(screen.getByText('Select water heating fuel...')).toBeInTheDocument();
    });

    it('renders the address placeholder', () => {
      renderPage();
      expect(screen.getByPlaceholderText('1234 Main St, Denver, CO 80014')).toBeInTheDocument();
    });

    it('renders no radio buttons selected by default', () => {
      renderPage();
      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).not.toBeChecked();
      });
    });
  });

  describe('back navigation', () => {
    it('navigates to the results page when BACK TO RESULTS is clicked', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/cesn/test-uuid/results/energy-rebates/hvac');
    });

    it('includes admin=true in back link when admin search param is present', () => {
      renderPage('/cesn/test-uuid/results/energy-rebates/waterHeater/calculate-impact?admin=true');
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/cesn/test-uuid/results/energy-rebates/hvac?admin=true',
      );
    });
  });

  describe('validation', () => {
    it('shows error for household type when submitting empty form', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select a household type/i)).toBeInTheDocument();
      });
    });

    it('shows error for address when submitting empty form', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid street address/i)).toBeInTheDocument();
      });
    });

    it('shows error for heating fuel when submitting empty form', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select a heating fuel/i)).toBeInTheDocument();
      });
    });

    it('shows error for upgrade choice when submitting empty form', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select one upgrade option/i)).toBeInTheDocument();
      });
    });

    describe('upgrade selection helper text', () => {
      it('shows the exact message "Please select one upgrade option." when no upgrade is selected', async () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

        await waitFor(() => {
          expect(screen.getByText('Please select one upgrade option.')).toBeInTheDocument();
        });
      });

      it('does not show upgrade error before the form is submitted', () => {
        renderPage();
        expect(screen.queryByText(/please select one upgrade option/i)).not.toBeInTheDocument();
      });

      it('clears the upgrade error after an upgrade is selected and the form is resubmitted', async () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));
        await waitFor(() => {
          expect(screen.getByText('Please select one upgrade option.')).toBeInTheDocument();
        });

        const householdSelect = screen.getByRole('button', { name: /household type/i });
        await selectOption(householdSelect, 'House');

        const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
        fireEvent.change(addressInput, { target: { value: '789 Pine St, Denver, CO 80202' } });

        const fuelSelect = screen.getByRole('button', { name: /heating fuel/i });
        await selectOption(fuelSelect, 'Natural gas');

        fireEvent.click(screen.getByRole('radio', { name: /^heat pump$/i }));
        fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

        await waitFor(() => {
          expect(screen.queryByText('Please select one upgrade option.')).not.toBeInTheDocument();
        });
      });
    });

    it('does NOT show error for water heating type (optional field)', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/please select a household type/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/please select a water heating/i)).not.toBeInTheDocument();
    });

    describe('HPWH radio disabled state', () => {
      it('disables the HPWH radio when no water heating fuel is selected', () => {
        renderPage();
        expect(screen.getByRole('radio', { name: /heat pump water heater/i })).toBeDisabled();
      });

      it('enables the HPWH radio after selecting a water heating fuel', async () => {
        renderPage();
        const hpwhRadio = screen.getByRole('radio', { name: /heat pump water heater/i });
        expect(hpwhRadio).toBeDisabled();

        const waterFuelSelect = screen.getByRole('button', { name: /water heating type/i });
        await selectOption(waterFuelSelect, 'Natural gas');

        expect(hpwhRadio).not.toBeDisabled();
      });

      it('resets upgrade choice when water heating fuel is cleared after selecting HPWH', async () => {
        renderPage();

        const waterFuelSelect = screen.getByRole('button', { name: /water heating type/i });
        await selectOption(waterFuelSelect, 'Natural gas');

        const hpwhRadio = screen.getByRole('radio', { name: /heat pump water heater/i });
        fireEvent.click(hpwhRadio);
        expect(hpwhRadio).toBeChecked();

        await selectOption(waterFuelSelect, 'No selection');

        await waitFor(() => {
          expect(hpwhRadio).not.toBeChecked();
          expect(hpwhRadio).toBeDisabled();
        });
      });
    });
  });

  describe('form interaction', () => {
    it('allows selecting a household type', async () => {
      renderPage();
      const householdSelect = screen.getByRole('button', { name: /household type/i });
      await selectOption(householdSelect, 'House');
      expect(householdSelect).toHaveTextContent('House');
    });

    it('allows typing an address', () => {
      renderPage();
      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      fireEvent.change(addressInput, { target: { value: '456 Oak Ave, Denver, CO 80203' } });
      expect(addressInput).toHaveValue('456 Oak Ave, Denver, CO 80203');
    });

    it('allows selecting a heating fuel', async () => {
      renderPage();
      const fuelSelect = screen.getByRole('button', { name: /heating fuel/i });
      await selectOption(fuelSelect, 'Natural gas');
      expect(fuelSelect).toHaveTextContent('Natural gas');
    });

    it('allows selecting an upgrade option via radio button', () => {
      renderPage();
      const heatPumpRadio = screen.getByRole('radio', { name: /^heat pump$/i });
      fireEvent.click(heatPumpRadio);
      expect(heatPumpRadio).toBeChecked();
    });

    it('has heat pump enabled and HPWH disabled initially (no "Coming soon")', () => {
      renderPage();
      expect(screen.getByRole('radio', { name: /^heat pump$/i })).not.toBeDisabled();
      expect(screen.getByRole('radio', { name: /heat pump water heater/i })).toBeDisabled();
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    });
  });

  describe('successful form submission', () => {
    const fillValidForm = async () => {
      renderPage();

      const householdSelect = screen.getByRole('button', { name: /household type/i });
      await selectOption(householdSelect, 'House');

      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      fireEvent.change(addressInput, { target: { value: '789 Pine St, Denver, CO 80202' } });

      const fuelSelect = screen.getByRole('button', { name: /heating fuel/i });
      await selectOption(fuelSelect, 'Natural gas');

      // Water heating fuel is required when HPWH is selected (superRefine validation)
      const waterFuelSelect = screen.getByRole('button', { name: /water heating type/i });
      await selectOption(waterFuelSelect, 'Natural gas');

      const hpwhRadio = screen.getByRole('radio', { name: /heat pump water heater/i });
      fireEvent.click(hpwhRadio);
    };

    it('does not show validation errors on valid submission', async () => {
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.queryByText(/please select a household type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please enter a valid street address/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please select a heating fuel/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please select one upgrade option/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please select a water heating fuel/i)).not.toBeInTheDocument();
      });
    });

    it('renders the results card after a successful API response', async () => {
      (jest.requireMock('./fetchRemImpact').fetchRemImpact as jest.Mock).mockResolvedValue(MOCK_RESULT);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/bill and emissions impact/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('heading', { name: /energy bill impact/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^emissions impact$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /your household info/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /selected upgrade/i })).toBeInTheDocument();
    });

    it('returns to the form when the edit button is clicked', async () => {
      (jest.requireMock('./fetchRemImpact').fetchRemImpact as jest.Mock).mockResolvedValue(MOCK_RESULT);
      await fillValidForm();
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/bill and emissions impact/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /edit household info/i }));

      expect(screen.getByRole('button', { name: /calculate impact/i })).toBeInTheDocument();
    });

    it('submits a non-HPWH upgrade without requiring water heating fuel', async () => {
      (jest.requireMock('./fetchRemImpact').fetchRemImpact as jest.Mock).mockResolvedValue(MOCK_RESULT);
      renderPage();

      const householdSelect = screen.getByRole('button', { name: /household type/i });
      await selectOption(householdSelect, 'House');

      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      fireEvent.change(addressInput, { target: { value: '789 Pine St, Denver, CO 80202' } });

      const fuelSelect = screen.getByRole('button', { name: /heating fuel/i });
      await selectOption(fuelSelect, 'Natural gas');

      // No water heating fuel selected — should be valid for a whole-home heat pump upgrade.
      const heatPumpRadio = screen.getByRole('radio', { name: /^heat pump$/i });
      fireEvent.click(heatPumpRadio);

      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));

      await waitFor(() => {
        expect(screen.getByText(/bill and emissions impact/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/please select a water heating fuel/i)).not.toBeInTheDocument();
    });
  });

  describe('API error states', () => {
    const fillAndSubmitHeatPumpForm = async () => {
      renderPage();
      const householdSelect = screen.getByRole('button', { name: /household type/i });
      await selectOption(householdSelect, 'House');
      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      fireEvent.change(addressInput, { target: { value: '1777 Larimer St, Denver, CO 80202' } });
      const fuelSelect = screen.getByRole('button', { name: /heating fuel/i });
      await selectOption(fuelSelect, 'Natural gas');
      fireEvent.click(screen.getByRole('radio', { name: /^heat pump$/i }));
      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));
    };

    it('shows the generic error alert on a non-address API failure', async () => {
      (jest.requireMock('./fetchRemImpact').fetchRemImpact as jest.Mock).mockRejectedValue(
        new Error('REM API error: 502'),
      );
      await fillAndSubmitHeatPumpForm();
      await waitFor(() => {
        expect(screen.getByText(/something went wrong calculating your impact/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/unable to calculate the impact for this address/i)).not.toBeInTheDocument();
    });

    it('shows the address-not-supported alert when RemAddressNotSupportedError is thrown', async () => {
      const { RemAddressNotSupportedError } = jest.requireMock('./fetchRemImpact');
      (jest.requireMock('./fetchRemImpact').fetchRemImpact as jest.Mock).mockRejectedValue(
        new RemAddressNotSupportedError(),
      );
      await fillAndSubmitHeatPumpForm();
      await waitFor(() => {
        expect(
          screen.getByText(/unable to calculate the impact for this address at this time/i),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/something went wrong calculating your impact/i)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has an accessible address input with autoComplete', () => {
      renderPage();
      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      expect(addressInput).toHaveAttribute('autocomplete', 'street-address');
    });

    it('has aria-describedby linking address to its helper text', () => {
      renderPage();
      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      expect(addressInput).toHaveAttribute('aria-describedby', 'calculate-impact-address-helper');
      expect(document.getElementById('calculate-impact-address-helper')).toBeInTheDocument();
    });

    it('renders the upgrade section with a fieldset role', () => {
      renderPage();
      expect(screen.getByRole('group')).toBeInTheDocument();
    });
  });
});
