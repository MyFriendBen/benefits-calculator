import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ShareModalAutoPopup from './ShareModalAutoPopup';

jest.mock('../Config/configHook', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('../Results/shared/ModalShell.css', () => ({}));
jest.mock('./ShareModal.css', () => ({}));

const renderAutoPopup = () =>
  render(
    <IntlProvider locale="en">
      <ShareModalAutoPopup />
    </IntlProvider>,
  );

const advanceToVisible = () => {
  act(() => {
    jest.advanceTimersByTime(5000);
  });
};

describe('ShareModalAutoPopup', () => {
  beforeEach(() => {
    const { useFeatureFlag } = require('../Config/configHook');
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
    renderAutoPopup();
    expect(screen.queryByRole('button', { name: /open share options/i })).not.toBeInTheDocument();
  });

  it('shows the minimized chip after 5 seconds', () => {
    renderAutoPopup();
    advanceToVisible();
    expect(screen.getByRole('button', { name: /open share options/i })).toBeInTheDocument();
    expect(screen.getByText('Share MyFriendBen')).toBeInTheDocument();
  });

  it('dismisses the chip when the close button is clicked', () => {
    renderAutoPopup();
    advanceToVisible();
    fireEvent.click(screen.getByLabelText('Close share popup'));
    expect(screen.queryByText('Share MyFriendBen')).not.toBeInTheDocument();
  });

  it('expands to the modal when the chip is clicked', () => {
    renderAutoPopup();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('minimizes back to chip when modal close button is clicked', () => {
    renderAutoPopup();
    advanceToVisible();
    fireEvent.click(screen.getByRole('button', { name: /open share options/i }));
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Share MyFriendBen')).toBeInTheDocument();
  });

  it('renders nothing when feature flag is disabled', () => {
    const { useFeatureFlag } = require('../Config/configHook');
    useFeatureFlag.mockReturnValue(false);
    renderAutoPopup();
    advanceToVisible();
    expect(screen.queryByText('Share MyFriendBen')).not.toBeInTheDocument();
  });
});
