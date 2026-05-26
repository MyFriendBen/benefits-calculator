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
  TrackedOutboundLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('../../Icons/Coin.svg', () => ({
  ReactComponent: () => <svg data-testid="coin-icon" />,
}));

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

    it('renders the intro paragraph with Rewiring America link', () => {
      renderPage();
      expect(screen.getByRole('link', { name: /rewiring america/i })).toHaveAttribute(
        'href',
        'https://www.rewiringamerica.org',
      );
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

    it('renders the Select upgrade section with all 4 radio options', () => {
      renderPage();
      expect(screen.getByText('Heat pump')).toBeInTheDocument();
      expect(screen.getByText('Weatherization')).toBeInTheDocument();
      expect(screen.getByText('Heat pump + weatherization')).toBeInTheDocument();
      expect(screen.getByText('Heat pump water heater')).toBeInTheDocument();
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
        expect(screen.getByText(/please select an upgrade option/i)).toBeInTheDocument();
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
  });

  describe('successful form submission', () => {
    const fillAndSubmit = async () => {
      renderPage();

      const householdSelect = screen.getByRole('button', { name: /household type/i });
      await selectOption(householdSelect, 'House');

      const addressInput = screen.getByPlaceholderText('1234 Main St, Denver, CO 80014');
      fireEvent.change(addressInput, { target: { value: '789 Pine St, Denver, CO 80202' } });

      const fuelSelect = screen.getByRole('button', { name: /heating fuel/i });
      await selectOption(fuelSelect, 'Natural gas');

      const heatPumpRadio = screen.getByRole('radio', { name: /^heat pump$/i });
      fireEvent.click(heatPumpRadio);

      fireEvent.click(screen.getByRole('button', { name: /calculate impact/i }));
    };

    it('does not show validation errors on valid submission', async () => {
      await fillAndSubmit();

      await waitFor(() => {
        expect(screen.queryByText(/please select a household type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please enter a valid street address/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please select a heating fuel/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/please select an upgrade option/i)).not.toBeInTheDocument();
      });
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
