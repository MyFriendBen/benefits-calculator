import { render, screen, fireEvent } from '@testing-library/react';
import NPSInline from './NPSInline';
import * as apiCalls from '../../apiCalls';

jest.mock('../../apiCalls', () => ({
  postNPSScore: jest.fn(),
  patchNPSReason: jest.fn(),
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
    render(<NPSInline uuid="test-uuid" />);

    expect(screen.getByText('How likely are you to recommend MyFriendBen to a friend?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
  });

  it('shows followup textarea after selecting a score', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(screen.getByText('What is the main reason for your score?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tell us more (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('does not show thank you immediately after selecting a score', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '9' }));

    expect(screen.queryByText('Thank you for your feedback!')).not.toBeInTheDocument();
  });

  it('shows thank you after submitting reason', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.change(screen.getByPlaceholderText('Tell us more (optional)'), {
      target: { value: 'Very helpful!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
  });

  it('shows thank you after skipping reason', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
  });

  it('calls postNPSScore when score is selected', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '7' }));

    expect(mockPostNPSScore).toHaveBeenCalledWith({
      uuid: 'test-uuid',
      score: 7,
      variant: 'inline',
    });
  });

  it('calls patchNPSReason when reason is submitted', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.change(screen.getByPlaceholderText('Tell us more (optional)'), {
      target: { value: 'Good info' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockPatchNPSReason).toHaveBeenCalledWith({
      uuid: 'test-uuid',
      score_reason: 'Good info',
    });
  });

  it('does not call patchNPSReason when skip is clicked', () => {
    render(<NPSInline uuid="test-uuid" />);

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(mockPatchNPSReason).not.toHaveBeenCalled();
  });
});
