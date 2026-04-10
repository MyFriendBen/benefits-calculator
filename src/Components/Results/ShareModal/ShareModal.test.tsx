import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ShareModal from './ShareModal';

jest.mock('../shared/ModalShell.css', () => ({}));
jest.mock('./ShareModal.css', () => ({}));

const renderModal = (open: boolean, onClose = jest.fn()) =>
  render(
    <IntlProvider locale="en">
      <ShareModal open={open} onClose={onClose} />
    </IntlProvider>,
  );

describe('ShareModal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh)',
      configurable: true,
    });
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when open is false', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog when open is true', () => {
    renderModal(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Share MyFriendBen')).toBeInTheDocument();
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
    fireEvent.click(screen.getByText('Email'));
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Outlook')).toBeInTheDocument();
    expect(screen.getByText('Yahoo Mail')).toBeInTheDocument();
    expect(screen.getByText('Apple Mail')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('goes back to main options from email provider list', () => {
    renderModal(true);
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByLabelText('Back'));
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();
  });

  it('shows "Copied!" feedback after clicking Copy Link', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    renderModal(true);
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
    expect(screen.queryByText('SMS')).not.toBeInTheDocument();
  });

  it('shows SMS and WhatsApp options on mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14)',
      configurable: true,
    });
    renderModal(true);
    expect(screen.getByText('SMS')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });

  it('resets view to options when reopened after close', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <IntlProvider locale="en">
        <ShareModal open={true} onClose={onClose} />
      </IntlProvider>,
    );
    fireEvent.click(screen.getByText('Email'));
    expect(screen.getByText('Gmail')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close dialog'));

    rerender(
      <IntlProvider locale="en">
        <ShareModal open={true} onClose={onClose} />
      </IntlProvider>,
    );
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});
