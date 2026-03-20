import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ShareModal from './ShareModal';

// Feature flag hook — mocked; implementation set in beforeEach to survive resetMocks
jest.mock('../../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

// Stub CSS imports
jest.mock('../shared/ModalShell.css', () => ({}));
jest.mock('./ShareModal.css', () => ({}));

const renderModal = () =>
  render(
    <IntlProvider locale="en">
      <ShareModal />
    </IntlProvider>,
  );

const advanceToVisible = () => {
  act(() => {
    jest.advanceTimersByTime(5000);
  });
};

describe('ShareModal', () => {
  beforeEach(() => {
    const { useFeatureFlag } = require('../../Config/configHook');
    useFeatureFlag.mockReturnValue(true);
    jest.useFakeTimers({ legacyFakeTimers: true });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh)',
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing before the 5-second delay', () => {
    renderModal();
    expect(screen.queryByRole('button', { name: /open share options/i })).not.toBeInTheDocument();
  });

  it('shows the minimized chip after 5 seconds', () => {
    renderModal();
    advanceToVisible();
    expect(screen.getByRole('button', { name: /open share options/i })).toBeInTheDocument();
    expect(screen.getByText('Share MyFriendBen')).toBeInTheDocument();
  });

  it('dismisses the chip when the close button is clicked', () => {
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByLabelText('Close share popup'));
    expect(screen.queryByText('Share MyFriendBen')).not.toBeInTheDocument();
  });

  it('expands to the modal when the chip is clicked', () => {
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('shows email provider list when Email option is clicked', () => {
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    fireEvent.click(screen.getByText('Email'));
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Outlook')).toBeInTheDocument();
    expect(screen.getByText('Yahoo Mail')).toBeInTheDocument();
    expect(screen.getByText('Apple Mail')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('goes back to main options from email provider list', () => {
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByLabelText('Back'));
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();
  });

  it('shows "Copied!" feedback after clicking Copy Link', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    await act(async () => {
      fireEvent.click(screen.getByText('Copy Link'));
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('resets "Copied!" back to "Copy Link" after 2 seconds', () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    fireEvent.click(screen.getByText('Copy Link'));
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('does not show SMS option on desktop', () => {
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    expect(screen.queryByText('SMS')).not.toBeInTheDocument();
  });

  it('shows SMS option on mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14)',
      configurable: true,
    });
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    expect(screen.getByText('SMS')).toBeInTheDocument();
  });

  it('minimizes when close button on modal is clicked', () => {
    renderModal();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Share MyFriendBen')).toBeInTheDocument();
  });

  it('renders nothing when feature flag is disabled', () => {
    const { useFeatureFlag } = require('../../Config/configHook');
    useFeatureFlag.mockReturnValue(false);
    renderModal();
    advanceToVisible();
    expect(screen.queryByText('Share MyFriendBen')).not.toBeInTheDocument();
  });
});
