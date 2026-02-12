import { render, screen, fireEvent } from '@testing-library/react';
import NPSFollowup from './NPSFollowup';

describe('NPSFollowup', () => {
  const defaultProps = {
    reason: '',
    setReason: jest.fn(),
    onSubmit: jest.fn(),
    onSkip: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the followup prompt', () => {
    render(<NPSFollowup {...defaultProps} />);

    expect(screen.getByText('What is the main reason for your score?')).toBeInTheDocument();
  });

  it('renders a textarea', () => {
    render(<NPSFollowup {...defaultProps} />);

    expect(screen.getByPlaceholderText('Tell us more (optional)')).toBeInTheDocument();
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

    const textarea = screen.getByPlaceholderText('Tell us more (optional)') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Great tool!');
  });

  it('calls setReason when textarea changes', () => {
    const mockSetReason = jest.fn();
    render(<NPSFollowup {...defaultProps} setReason={mockSetReason} />);

    fireEvent.change(screen.getByPlaceholderText('Tell us more (optional)'), {
      target: { value: 'Helpful resources' },
    });

    expect(mockSetReason).toHaveBeenCalledWith('Helpful resources');
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
