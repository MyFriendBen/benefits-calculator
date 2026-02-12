import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import NPSFollowup from './NPSFollowup';

const renderFollowup = (props = {}) =>
  render(
    <IntlProvider locale="en">
      <NPSFollowup {...defaultProps} {...props} />
    </IntlProvider>,
  );

const defaultProps = {
  selectedScore: 8,
  reason: '',
  setReason: jest.fn(),
  onSubmit: jest.fn(),
  onSkip: jest.fn(),
};

describe('NPSFollowup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('score-based prompts', () => {
    it('shows "What did we do well?" for score 9', () => {
      renderFollowup({ selectedScore: 9 });
      expect(screen.getByText('What did we do well?')).toBeInTheDocument();
    });

    it('shows "What did we do well?" for score 10', () => {
      renderFollowup({ selectedScore: 10 });
      expect(screen.getByText('What did we do well?')).toBeInTheDocument();
    });

    it('shows "What could we improve?" for score 7', () => {
      renderFollowup({ selectedScore: 7 });
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });

    it('shows "What could we improve?" for score 8', () => {
      renderFollowup({ selectedScore: 8 });
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });

    it('shows "What disappointed you?" for score 6', () => {
      renderFollowup({ selectedScore: 6 });
      expect(screen.getByText('What disappointed you?')).toBeInTheDocument();
    });

    it('shows "What disappointed you?" for score 1', () => {
      renderFollowup({ selectedScore: 1 });
      expect(screen.getByText('What disappointed you?')).toBeInTheDocument();
    });
  });

  describe('score pill', () => {
    it('displays the selected score in a pill', () => {
      renderFollowup({ selectedScore: 7 });
      expect(screen.getByText('You selected: 7')).toBeInTheDocument();
    });
  });

  it('renders a textarea', () => {
    renderFollowup();
    expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderFollowup();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders skip button', () => {
    renderFollowup();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('displays the reason value in the textarea', () => {
    renderFollowup({ reason: 'Great tool!' });
    const textarea = screen.getByPlaceholderText('Share your thoughts...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Great tool!');
  });

  it('calls setReason when textarea changes', () => {
    const mockSetReason = jest.fn();
    renderFollowup({ setReason: mockSetReason });

    fireEvent.change(screen.getByPlaceholderText('Share your thoughts...'), {
      target: { value: 'Helpful resources' },
    });

    expect(mockSetReason).toHaveBeenCalledWith('Helpful resources');
  });

  it('has maxLength attribute set to 500 on textarea', () => {
    renderFollowup();
    const textarea = screen.getByPlaceholderText('Share your thoughts...') as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('shows character count', () => {
    renderFollowup({ reason: 'Hello' });
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', () => {
    const mockOnSubmit = jest.fn();
    renderFollowup({ onSubmit: mockOnSubmit });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when skip button is clicked', () => {
    const mockOnSkip = jest.fn();
    renderFollowup({ onSkip: mockOnSkip });

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });
});
