import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import { createMockContextValue } from '../../test-utils/renderHelpers';
import ShareModal from './ShareModal';
import { clearShareMessagesCache } from './useShareMessages';

jest.mock('../Results/shared/ModalShell.css', () => ({}));
jest.mock('./ShareModal.css', () => ({}));

jest.mock('../../apiCalls', () => ({
  getTranslations: jest.fn(),
}));

const { getTranslations } = require('../../apiCalls');

const LANGUAGE_OPTIONS = { 'en-us': 'English', es: 'Español' };

const renderModal = (open: boolean, onClose = jest.fn()) =>
  render(
    <Context.Provider value={createMockContextValue({ config: { language_options: LANGUAGE_OPTIONS } as any })}>
      <IntlProvider locale="en-us">
        <MemoryRouter>
          <ShareModal open={open} onClose={onClose} shareLocation="results_popup" />
        </MemoryRouter>
      </IntlProvider>
    </Context.Provider>,
  );

// The modal now opens on the language step; the channel list is one click in.
const continueFromLanguageStep = () => fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

describe('ShareModal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh)',
      configurable: true,
    });
    jest.useFakeTimers({ legacyFakeTimers: true });
    getTranslations.mockReset();
    clearShareMessagesCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when open is false', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the language step, not the channel list', () => {
    renderModal(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('What language should we send it in?')).toBeInTheDocument();
    expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
  });

  it('defaults the share language to the sender’s own language', () => {
    renderModal(true);
    expect(screen.getByRole('button', { name: /English/ })).toBeInTheDocument();
  });

  it('renders the channel list after the language step', () => {
    renderModal(true);
    continueFromLanguageStep();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderModal(true, onClose);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows email provider list when Email option is clicked', () => {
    renderModal(true);
    continueFromLanguageStep();
    fireEvent.click(screen.getByText('Email'));
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Outlook')).toBeInTheDocument();
    expect(screen.getByText('Yahoo Mail')).toBeInTheDocument();
    expect(screen.getByText('Apple Mail')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('goes back to main options from email provider list', () => {
    renderModal(true);
    continueFromLanguageStep();
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByLabelText('Back'));
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();
  });

  it('goes back to the language step from the channel list', () => {
    renderModal(true);
    continueFromLanguageStep();
    fireEvent.click(screen.getByLabelText('Back'));
    expect(screen.getByText('What language should we send it in?')).toBeInTheDocument();
    expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
  });

  it('shows "Copied!" feedback after clicking Copy Link', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    renderModal(true);
    continueFromLanguageStep();
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Link'));
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('resets "Copied!" back to "Copy Link" after 2 seconds', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    renderModal(true);
    continueFromLanguageStep();
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Link'));
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('does not show SMS option on desktop', () => {
    renderModal(true);
    continueFromLanguageStep();
    expect(screen.queryByText('SMS')).not.toBeInTheDocument();
  });

  it('shows SMS and WhatsApp options on mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14)',
      configurable: true,
    });
    renderModal(true);
    continueFromLanguageStep();
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });

  it('does not fetch translations when sharing in the sender’s own language', () => {
    renderModal(true);
    continueFromLanguageStep();
    expect(getTranslations).not.toHaveBeenCalled();
  });

  it('resets view and language to the start when reopened after close', async () => {
    getTranslations.mockResolvedValue({ es: { 'sharePopup.shareBody': 'Hola {url}' } });
    const onClose = jest.fn();
    const { rerender } = renderModal(true, onClose);

    fireEvent.mouseDown(screen.getByRole('button', { name: /English/ }));
    fireEvent.click(screen.getByRole('option', { name: 'Español' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled());
    continueFromLanguageStep();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close dialog'));

    rerender(
      <Context.Provider value={createMockContextValue({ config: { language_options: LANGUAGE_OPTIONS } as any })}>
        <IntlProvider locale="en-us">
          <MemoryRouter>
            <ShareModal open={true} onClose={onClose} shareLocation="results_popup" />
          </MemoryRouter>
        </IntlProvider>
      </Context.Provider>,
    );

    expect(screen.getByText('What language should we send it in?')).toBeInTheDocument();
    // Back on the sender's language, not the Spanish carried over from last time.
    expect(screen.getByRole('button', { name: /English/ })).toBeInTheDocument();
  });

  describe('sharing in a language the sender is not using', () => {
    const pickSpanish = async () => {
      fireEvent.mouseDown(screen.getByRole('button', { name: /English/ }));
      fireEvent.click(screen.getByRole('option', { name: 'Español' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled());
      continueFromLanguageStep();
    };

    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14)',
        configurable: true,
      });
    });

    it('puts the recipient’s language in the message while the sender’s UI stays put', async () => {
      getTranslations.mockResolvedValue({
        es: {
          'sharePopup.shareBody': 'Hola, mira MyFriendBen {url}',
          'sharePopup.emailSubject': 'Conoce MyFriendBen',
          // Proves the channel labels are NOT taken from the recipient's language:
          // they are the sender's own UI and must stay in the sender's language.
          'sharePopup.sms': 'Mensaje de texto',
        },
      });

      renderModal(true);
      await pickSpanish();

      expect(getTranslations).toHaveBeenCalledWith('es');

      const smsLink = screen.getByText('SMS').closest('a');
      expect(smsLink).toHaveAttribute(
        'href',
        `sms:?body=${encodeURIComponent('Hola, mira MyFriendBen https://screener.myfriendben.org/share/sms')}`,
      );

      // The sender still sees English chrome.
      expect(screen.getByText('Share MyFriendBen')).toBeInTheDocument();
      expect(screen.getByText('Share via text message')).toBeInTheDocument();
    });

    it('carries the recipient’s language into the email subject', async () => {
      getTranslations.mockResolvedValue({
        es: {
          'sharePopup.shareBody': 'Hola {url}',
          'sharePopup.emailSubject': 'Conoce MyFriendBen',
        },
      });

      renderModal(true);
      await pickSpanish();
      fireEvent.click(screen.getByText('Email'));

      const gmailLink = screen.getByText('Gmail').closest('a');
      expect(gmailLink?.getAttribute('href')).toContain(encodeURIComponent('Conoce MyFriendBen'));
    });

    it('blocks Continue until the recipient’s translations have loaded', async () => {
      let resolveTranslations: (value: unknown) => void = () => {};
      getTranslations.mockReturnValue(new Promise((resolve) => (resolveTranslations = resolve)));

      renderModal(true);
      fireEvent.mouseDown(screen.getByRole('button', { name: /English/ }));
      fireEvent.click(screen.getByRole('option', { name: 'Español' }));

      expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();

      await act(async () => {
        resolveTranslations({ es: { 'sharePopup.shareBody': 'Hola {url}' } });
      });

      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });

    it('falls back to the sender’s language when the fetch fails', async () => {
      getTranslations.mockRejectedValue(new Error('network'));

      renderModal(true);
      await pickSpanish();

      const smsLink = screen.getByText('SMS').closest('a');
      expect(smsLink?.getAttribute('href')).toContain(encodeURIComponent('Hey, wanted to share MyFriendBen'));
    });

    it('fetches a given language only once across reopens', async () => {
      getTranslations.mockResolvedValue({ es: { 'sharePopup.shareBody': 'Hola {url}' } });

      renderModal(true);
      await pickSpanish();
      expect(getTranslations).toHaveBeenCalledTimes(1);

      renderModal(true);
      const triggers = screen.getAllByRole('button', { name: /English/ });
      fireEvent.mouseDown(triggers[triggers.length - 1]);
      const listbox = await screen.findByRole('listbox');
      fireEvent.click(within(listbox).getByRole('option', { name: 'Español' }));

      expect(getTranslations).toHaveBeenCalledTimes(1);
    });
  });
});
