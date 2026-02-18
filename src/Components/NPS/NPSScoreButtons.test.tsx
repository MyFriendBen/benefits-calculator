import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import NPSScoreButtons from './NPSScoreButtons';

const renderWithIntl = (ui: React.ReactElement) => render(<IntlProvider locale="en">{ui}</IntlProvider>);

describe('NPSScoreButtons', () => {
  const mockOnScoreClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 10 score buttons (1-10)', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
  });

  it('renders labels', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    expect(screen.getByText('Not at all likely')).toBeInTheDocument();
    expect(screen.getByText('Extremely likely')).toBeInTheDocument();
  });

  it('calls onScoreClick when a button is clicked', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    fireEvent.click(screen.getByRole('button', { name: '8' }));

    expect(mockOnScoreClick).toHaveBeenCalledWith(8);
  });

  it('calls onScoreClick with 1 when first button is clicked', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    fireEvent.click(screen.getByRole('button', { name: '1' }));

    expect(mockOnScoreClick).toHaveBeenCalledWith(1);
  });

  it('calls onScoreClick with 10 when last button is clicked', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    fireEvent.click(screen.getByRole('button', { name: '10' }));

    expect(mockOnScoreClick).toHaveBeenCalledWith(10);
  });

  it('applies selected class to the selected score button', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={7} onScoreClick={mockOnScoreClick} />);

    const selectedButton = screen.getByRole('button', { name: '7' });
    expect(selectedButton).toHaveClass('selected');
  });

  it('does not apply selected class to non-selected buttons', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={7} onScoreClick={mockOnScoreClick} />);

    const unselectedButton = screen.getByRole('button', { name: '5' });
    expect(unselectedButton).not.toHaveClass('selected');
  });

  it('does not apply selected class when selectedScore is null', () => {
    renderWithIntl(<NPSScoreButtons selectedScore={null} onScoreClick={mockOnScoreClick} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toHaveClass('selected');
    });
  });
});
