import { render, screen, fireEvent } from '@testing-library/react';
import { GooglePlacesAddressInput } from './GooglePlacesAddressInput';

const PLACEHOLDER = '1234 Main St, Denver, CO 80014';

const defaultProps = {
  value: '',
  onChange: jest.fn(),
  placeholder: PLACEHOLDER,
};

jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('GooglePlacesAddressInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  });

  describe('without API key (plain text fallback)', () => {
    it('renders a text input', () => {
      render(<GooglePlacesAddressInput {...defaultProps} />);
      expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
    });

    it('calls onChange when the user types', () => {
      const onChange = jest.fn();
      render(<GooglePlacesAddressInput {...defaultProps} onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), {
        target: { value: '456 Oak Ave, Denver, CO 80203' },
      });
      expect(onChange).toHaveBeenCalledWith('456 Oak Ave, Denver, CO 80203');
    });

    it('displays the provided value', () => {
      render(<GooglePlacesAddressInput {...defaultProps} value="789 Pine St" />);
      expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveValue('789 Pine St');
    });

    it('applies error state', () => {
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
  });

  describe('with API key (autocomplete enabled)', () => {
    beforeEach(() => {
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    });

    it('renders a text input via LoadScript', () => {
      render(<GooglePlacesAddressInput {...defaultProps} />);
      expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
    });

    it('calls onChange when the user types manually', () => {
      const onChange = jest.fn();
      render(<GooglePlacesAddressInput {...defaultProps} onChange={onChange} />);
      fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), {
        target: { value: '123 Elm St' },
      });
      expect(onChange).toHaveBeenCalledWith('123 Elm St');
    });
  });
});
