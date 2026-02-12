import { render, screen, fireEvent } from '@testing-library/react';
import NPSFollowup from './NPSFollowup';

describe('NPSFollowup', () => {
  const defaultProps = {
    selectedScore: 8,
    reason: '',
    setReason: jest.fn(),
    onSubmit: jest.fn(),
    onSkip: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('score-based prompts', () => {
    it('shows "What did we do well?" for score 9', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={9} />);
      expect(screen.getByText('What did we do well?')).toBeInTheDocument();
    });

    it('shows "What did we do well?" for score 10', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={10} />);
      expect(screen.getByText('What did we do well?')).toBeInTheDocument();
    });

    it('shows "What could we improve?" for score 7', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={7} />);
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });

    it('shows "What could we improve?" for score 8', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={8} />);
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });

    it('shows "What disappointed you?" for score 6', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={6} />);
      expect(screen.getByText('What disappointed you?')).toBeInTheDocument();
    });

    it('shows "What disappointed you?" for score 1', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={1} />);
      expect(screen.getByText('What disappointed you?')).toBeInTheDocument();
    });
  });

  describe('score pill', () => {
    it('displays the selected score in a pill', () => {
      render(<NPSFollowup {...defaultProps} selectedScore={7} />);
      expect(screen.getByText('You selected: 7')).toBeInTheDocument();
    });
  });

  it('renders a textarea', () => {
    render(<NPSFollowup {...defaultProps} />);
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<NPSFollowup {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(<NPSFollowup {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('displays the reason value in the textarea', () => {
    render(<NPSFollowup {...defaultProps} reason="Great tool!" />);
    const textarea = screen.getByPlaceholderText('Share your thoughts...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Great tool!');
  });

  it('calls setReason when textarea changes', () => {
    const mockSetReason = jest.fn();
    render(<NPSFollowup {...defaultProps} setReason={mockSetReason} />);

    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
      target: { value: 'Helpful resources' },
    });

    expect(mockSetReason).toHaveBeenCalledWith('Helpful resources');
  });

  it('does not call setReason when input exceeds 500 characters', () => {
    const mockSetReason = jest.fn();
    render(<NPSFollowup {...defaultProps} setReason={mockSetReason} />);

    const longText = 'a'.repeat(501);
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
      target: { value: longText },
    });

    expect(mockSetReason).not.toHaveBeenCalled();
  });

  it('shows character count', () => {
    render(<NPSFollowup {...defaultProps} reason="Hello" />);
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', () => {
    const mockOnSubmit = jest.fn();
    render(<NPSFollowup {...defaultProps} onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when skip button is clicked', () => {
    const mockOnSkip = jest.fn();
    render(<NPSFollowup {...defaultProps} onSkip={mockOnSkip} />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });
});
