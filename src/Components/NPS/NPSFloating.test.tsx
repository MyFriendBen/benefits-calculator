import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import NPSFloating from './NPSFloating';
import * as apiCalls from '../../apiCalls';

jest.mock('../../apiCalls', () => ({
  postNPSScore: jest.fn(),
  patchNPSReason: jest.fn(),
}));

const mockPostNPSScore = apiCalls.postNPSScore as jest.MockedFunction<typeof apiCalls.postNPSScore>;
const mockPatchNPSReason = apiCalls.patchNPSReason as jest.MockedFunction<typeof apiCalls.patchNPSReason>;

describe('NPSFloating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPostNPSScore.mockResolvedValue({ status: 'success' });
    mockPatchNPSReason.mockResolvedValue({ status: 'success' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing initially before delay', () => {
    const { container } = render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    expect(container.firstChild).toBeNull();
  });

  it('renders score buttons after 5 second delay', () => {
    render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText('How likely are you to recommend MyFriendBen to a friend?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });

  it('renders dismiss button when visible', () => {
    render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('hides when dismiss is clicked', () => {
    const { container } = render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByLabelText('Dismiss'));

    expect(container.firstChild).toBeNull();
  });

  it('shows followup textarea after selecting a score', () => {
    render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));

    expect(screen.getByText("What's the main reason for your score?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('does not show thank you immediately after selecting a score', () => {
    render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));

    expect(screen.queryByText('Thank you for your feedback!')).not.toBeInTheDocument();
  });

  it('shows thank you after submitting reason', () => {
    render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
      target: { value: 'Great tool!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('shows thank you after skipping reason', () => {
    render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
  });

  it('can dismiss during followup step', () => {
    const { container } = render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByLabelText('Dismiss'));

    expect(container.firstChild).toBeNull();
  });

  it('hides when close is clicked on thank you screen', () => {
    const { container } = render(<IntlProvider locale="en"><NPSFloating uuid="test-uuid" /></IntlProvider>);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(container.firstChild).toBeNull();
  });
});
