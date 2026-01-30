import { render, screen, fireEvent } from '@testing-library/react';
import NPSScoreButtons from './NPSScoreButtons';

describe('NPSScoreButtons', () => {
  const mockOnScoreClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 11 score buttons (0-10)', () => {
    render(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders labels', () => {
    render(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    expect(screen.getByText('Not at all likely')).toBeInTheDocument();
    expect(screen.getByText('Extremely likely')).toBeInTheDocument();
  });

  it('calls onScoreClick when a button is clicked', () => {
    render(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    fireEvent.click(screen.getByRole('button', { name: '8' }));

    expect(mockOnScoreClick).toHaveBeenCalledWith(8);
  });

  it('calls onScoreClick with 0 when first button is clicked', () => {
    render(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    fireEvent.click(screen.getByRole('button', { name: '0' }));

    expect(mockOnScoreClick).toHaveBeenCalledWith(0);
  });

  it('calls onScoreClick with 10 when last button is clicked', () => {
    render(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    fireEvent.click(screen.getByRole('button', { name: '10' }));

    expect(mockOnScoreClick).toHaveBeenCalledWith(10);
  });

  it('applies selected class to the selected score button', () => {
    render(<NPSScoreButtons selectedScore={7} onScoreClick={mockOnScoreClick} />);

    const selectedButton = screen.getByRole('button', { name: '7' });
    expect(selectedButton).toHaveClass('selected');
  });

  it('does not apply selected class to non-selected buttons', () => {
    render(<NPSScoreButtons selectedScore={7} onScoreClick={mockOnScoreClick} />);

    const unselectedButton = screen.getByRole('button', { name: '5' });
    expect(unselectedButton).not.toHaveClass('selected');
  });

  it('does not apply selected class when selectedScore is null', () => {
    render(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toHaveClass('selected');
    });
  });
});
