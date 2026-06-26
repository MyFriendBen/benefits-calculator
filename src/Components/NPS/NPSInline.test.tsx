import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import NPSInline from './NPSInline';
import * as apiCalls from '../../apiCalls';

jest.mock('../../apiCalls', () => ({
  postNPSScore: jest.fn(),
  patchNPSReason: jest.fn(),
}));

jest.mock('../Config/configHook', () => ({
  useConfig: () => ({}),
}));

const mockPostNPSScore = apiCalls.postNPSScore as jest.MockedFunction<typeof apiCalls.postNPSScore>;
const mockPatchNPSReason = apiCalls.patchNPSReason as jest.MockedFunction<typeof apiCalls.patchNPSReason>;

describe('NPSInline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostNPSScore.mockResolvedValue({ status: 'success' });
    mockPatchNPSReason.mockResolvedValue({ status: 'success' });
  });

  it('renders score buttons initially', () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    expect(screen.getByText('How likely are you to recommend MyFriendBen to a friend?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });

  it('shows followup textarea after selecting a score', () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(screen.getByText("What's behind your score?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('does not show thank you immediately after selecting a score', () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(screen.queryByText('Thank you for your feedback!')).not.toBeInTheDocument();
  });

  it('shows thank you after submitting reason', async () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
      target: { value: 'Very helpful!' },
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
  });

  it('shows thank you after skipping reason', async () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '9' }));
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    });

    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
  });

  it('calls postNPSScore when score is selected', () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '7' }));

    expect(mockPostNPSScore).toHaveBeenCalledWith({
      uuid: 'test-uuid',
      score: 7,
    });
  });

  it('calls patchNPSReason when reason is submitted', async () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
      target: { value: 'Good info' },
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    expect(mockPatchNPSReason).toHaveBeenCalledWith({
      uuid: 'test-uuid',
      score_reason: 'Good info',
    });
  });

  it('does not call patchNPSReason when skip is clicked', async () => {
    render(<IntlProvider locale="en"><NPSInline uuid="test-uuid" /></IntlProvider>);

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    });

    expect(mockPatchNPSReason).not.toHaveBeenCalled();
  });
});
