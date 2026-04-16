import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import SaveMyResultsModal from './SaveMyResultsModal';
import { postMessage } from '../../../apiCalls';

jest.mock('../../../apiCalls', () => ({
  postMessage: jest.fn(),
}));

jest.mock('../shared/ModalShell.css', () => ({}));
jest.mock('./SaveMyResultsModal.css', () => ({}));
jest.mock('./SaveViaWhatsAppForm', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div>
      <span>WhatsApp Number</span>
      <button type="button" onClick={onSuccess}>Send Results</button>
    </div>
  ),
}));

// PhoneNumberInput can have complex internals — keep it simple
jest.mock('../../Common/PhoneNumberInput', () => ({
  __esModule: true,
  default: ({ value, onChange, onBlur, name, error, helperText, placeholder }: any) => (
    <div>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder ?? '1234567890'}
        aria-label="Cell Phone"
        data-testid="phone-input"
      />
      {error && <span>{helperText}</span>}
    </div>
  ),
}));

const mockFormData = {
  signUpInfo: { email: '', phone: '' },
};

const renderModal = (onClose = jest.fn()) =>
  render(
    <MemoryRouter initialEntries={['/results/test-uuid']}>
      <Routes>
        <Route
          path="/results/:uuid"
          element={
            <IntlProvider locale="en">
              <Context.Provider value={{ formData: mockFormData } as any}>
                <SaveMyResultsModal onClose={onClose} />
              </Context.Provider>
            </IntlProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('SaveMyResultsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh)',
      configurable: true,
    });
  });

  describe('options view', () => {
    it('renders the title and options', () => {
      renderModal();
      expect(screen.getByText('Save My Results')).toBeInTheDocument();
      expect(screen.getByText('Choose how to save your results')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Email a link to your results')).toBeInTheDocument();
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
      expect(screen.getByText('Copy a link to your results')).toBeInTheDocument();
    });

    it('always shows SMS and WhatsApp options', () => {
      renderModal();
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      renderModal(onClose);
      fireEvent.click(document.querySelector('.modal-shell-backdrop')!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderModal(onClose);
      fireEvent.click(screen.getByLabelText('Close dialog'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows "Copied!" after clicking Copy to Clipboard', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
      });
      renderModal();
      await act(async () => {
        fireEvent.click(screen.getByText('Copy to Clipboard'));
      });
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  describe('email view', () => {
    it('navigates to email form when Email is clicked', () => {
      renderModal();
      fireEvent.click(screen.getByText('Email'));
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
    });

    it('shows back button in email view', () => {
      renderModal();
      fireEvent.click(screen.getByText('Email'));
      expect(screen.getByLabelText('Back')).toBeInTheDocument();
    });

    it('returns to options when back is clicked from email view', () => {
      renderModal();
      fireEvent.click(screen.getByText('Email'));
      fireEvent.click(screen.getByLabelText('Back'));
      expect(screen.getByText('Choose how to save your results')).toBeInTheDocument();
    });

    it('submits email and returns to options view on success', async () => {
      (postMessage as jest.Mock).mockResolvedValue({});
      renderModal();
      fireEvent.click(screen.getByText('Email'));

      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(postMessage).toHaveBeenCalledWith({
          screen: 'test-uuid',
          email: 'test@example.com',
          type: 'emailScreen',
        });
        expect(screen.getByText('Results Sent')).toBeInTheDocument();
      });
    });

    it('shows inline error and stays on email view when submit fails', async () => {
      (postMessage as jest.Mock).mockRejectedValue(new Error('Network error'));
      renderModal();
      fireEvent.click(screen.getByText('Email'));

      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(screen.getByText('Failed to send. Please try again.')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email', async () => {
      renderModal();
      fireEvent.click(screen.getByText('Email'));
      fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), {
        target: { value: 'not-an-email' },
      });
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('shows validation error when email is empty', async () => {
      renderModal();
      fireEvent.click(screen.getByText('Email'));
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
      expect(postMessage).not.toHaveBeenCalled();
    });
  });

  describe('sms view', () => {
    it('navigates to SMS form when SMS is clicked', () => {
      renderModal();
      fireEvent.click(screen.getByText('SMS'));
      expect(screen.getByText('Enter your phone number')).toBeInTheDocument();
      expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    });

    it('returns to options when back is clicked from SMS view', () => {
      renderModal();
      fireEvent.click(screen.getByText('SMS'));
      fireEvent.click(screen.getByLabelText('Back'));
      expect(screen.getByText('Choose how to save your results')).toBeInTheDocument();
    });

    it('submits phone and returns to options view on success', async () => {
      (postMessage as jest.Mock).mockResolvedValue({});
      renderModal();
      fireEvent.click(screen.getByText('SMS'));

      fireEvent.change(screen.getByTestId('phone-input'), {
        target: { value: '3031234567' },
      });
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(postMessage).toHaveBeenCalledWith({
          screen: 'test-uuid',
          phone: '+13031234567',
          type: 'textScreen',
        });
        expect(screen.getByText('Results Sent')).toBeInTheDocument();
      });
    });

    it('shows inline error and stays on SMS view when submit fails', async () => {
      (postMessage as jest.Mock).mockRejectedValue(new Error('Network error'));
      renderModal();
      fireEvent.click(screen.getByText('SMS'));

      fireEvent.change(screen.getByTestId('phone-input'), {
        target: { value: '3031234567' },
      });
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(screen.getByText('Failed to send. Please try again.')).toBeInTheDocument();
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });
    });

    it('shows validation error for phone number that is too short', async () => {
      renderModal();
      fireEvent.click(screen.getByText('SMS'));
      fireEvent.change(screen.getByTestId('phone-input'), {
        target: { value: '123' },
      });
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(screen.getByText('Please enter a 10 digit phone number')).toBeInTheDocument();
      });
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('shows validation error when phone is empty', async () => {
      renderModal();
      fireEvent.click(screen.getByText('SMS'));
      fireEvent.click(screen.getByText('Send Results'));

      await waitFor(() => {
        expect(screen.getByText('Please enter a 10 digit phone number')).toBeInTheDocument();
      });
      expect(postMessage).not.toHaveBeenCalled();
    });
  });

  describe('whatsapp view', () => {
    it('navigates to WhatsApp form when WhatsApp is clicked', () => {
      renderModal();
      fireEvent.click(screen.getByText('WhatsApp'));
      expect(screen.getByText('Enter your phone number')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp Number')).toBeInTheDocument();
    });

    it('returns to options when back is clicked from WhatsApp view', () => {
      renderModal();
      fireEvent.click(screen.getByText('WhatsApp'));
      fireEvent.click(screen.getByLabelText('Back'));
      expect(screen.getByText('Choose how to save your results')).toBeInTheDocument();
    });

    it('shows success view when form calls onSuccess', () => {
      renderModal();
      fireEvent.click(screen.getByText('WhatsApp'));
      fireEvent.click(screen.getByText('Send Results'));
      expect(screen.getByText('Results Sent')).toBeInTheDocument();
    });
  });
});
