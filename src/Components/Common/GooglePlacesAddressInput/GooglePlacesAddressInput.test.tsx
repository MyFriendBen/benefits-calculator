import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GooglePlacesAddressInput } from './GooglePlacesAddressInput';
import { fetchAddressSuggestions } from '../../EnergyCalculator/Results/HeatPumpJourney/fetchAddressSuggestions';

jest.mock('../../EnergyCalculator/Results/HeatPumpJourney/fetchAddressSuggestions');

const mockFetch = fetchAddressSuggestions as jest.MockedFunction<typeof fetchAddressSuggestions>;

const PLACEHOLDER = '1234 Main St, Denver, CO 80014';

const defaultProps = {
  value: '',
  onChange: jest.fn(),
  placeholder: PLACEHOLDER,
};

describe('GooglePlacesAddressInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a text input with the given placeholder', () => {
    render(<GooglePlacesAddressInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    render(<GooglePlacesAddressInput {...defaultProps} value="789 Pine St" />);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveValue('789 Pine St');
  });

  it('calls onChange when the user types', () => {
    const onChange = jest.fn();
    render(<GooglePlacesAddressInput {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: '123 Main' } });
    expect(onChange).toHaveBeenCalledWith('123 Main');
  });

  it('shows error helper text when error is set', () => {
    render(<GooglePlacesAddressInput {...defaultProps} error helperText="Please enter a valid street address." />);
    expect(screen.getByText('Please enter a valid street address.')).toBeInTheDocument();
  });

  it('forwards id and inputProps to the underlying input', () => {
    render(
      <GooglePlacesAddressInput
        {...defaultProps}
        id="address-field"
        inputProps={{ autoComplete: 'street-address', 'aria-describedby': 'address-helper' }}
      />,
    );
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    expect(input).toHaveAttribute('id', 'address-field');
    expect(input).toHaveAttribute('autocomplete', 'street-address');
    expect(input).toHaveAttribute('aria-describedby', 'address-helper');
  });

  it('debounces fetchAddressSuggestions calls while typing', async () => {
    render(<GooglePlacesAddressInput {...defaultProps} />);
    const input = screen.getByPlaceholderText(PLACEHOLDER);

    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.change(input, { target: { value: '123' } });

    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('123');
  });

  it('populates options from the API response', async () => {
    mockFetch.mockResolvedValue([
      { description: '123 Main St, Denver, CO 80014', place_id: 'abc' },
      { description: '123 Main Ave, Boulder, CO 80302', place_id: 'def' },
    ]);

    render(<GooglePlacesAddressInput {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: '123 Main' } });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByText('123 Main St, Denver, CO 80014')).toBeInTheDocument();
    });
  });

  it('calls onChange with the description when an option is selected', async () => {
    const onChange = jest.fn();
    mockFetch.mockResolvedValue([{ description: '123 Main St, Denver, CO 80014', place_id: 'abc' }]);

    render(<GooglePlacesAddressInput {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: '123 Main' } });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => screen.getByText('123 Main St, Denver, CO 80014'));
    fireEvent.click(screen.getByText('123 Main St, Denver, CO 80014'));

    expect(onChange).toHaveBeenCalledWith('123 Main St, Denver, CO 80014');
  });

  it('does not call fetch when input is empty', async () => {
    render(<GooglePlacesAddressInput {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: '' } });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('clears options silently when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<GooglePlacesAddressInput {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: '123 Main' } });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });
});
