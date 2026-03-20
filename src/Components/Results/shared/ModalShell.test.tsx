import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ModalShell from './ModalShell';

const renderShell = (props: Partial<React.ComponentProps<typeof ModalShell>> = {}) => {
  return render(
    <IntlProvider locale="en">
      <ModalShell
        headerIcon={<span data-testid="header-icon" />}
        title="Test Title"
        onClose={jest.fn()}
        {...props}
      >
        <div data-testid="child-content">children</div>
      </ModalShell>
    </IntlProvider>,
  );
};

describe('ModalShell', () => {
  it('renders title and children', () => {
    renderShell();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderShell({ subtitle: 'Test subtitle' });
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    renderShell();
    expect(screen.queryByText('Test subtitle')).not.toBeInTheDocument();
  });

  it('renders the header icon', () => {
    renderShell();
    expect(screen.getByTestId('header-icon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderShell({ onClose });
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = renderShell({ onClose });
    const backdrop = container.querySelector('.modal-shell-backdrop');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders back button when onBack is provided', () => {
    renderShell({ onBack: jest.fn() });
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });

  it('does not render back button when onBack is omitted', () => {
    renderShell();
    expect(screen.queryByLabelText('Back')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = jest.fn();
    renderShell({ onBack });
    fireEvent.click(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders as a dialog with aria-modal', () => {
    renderShell();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
