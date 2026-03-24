import { render, screen, fireEvent } from '@testing-library/react';
import ModalOption from './ModalOption';

describe('ModalOption', () => {
  it('renders label and sublabel', () => {
    render(
      <ModalOption
        icon={<span />}
        label="Email"
        sublabel="Send via email"
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Send via email')).toBeInTheDocument();
  });

  it('renders as a button when no href', () => {
    render(<ModalOption icon={<span />} label="Click me" onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', () => {
    const onClick = jest.fn();
    render(<ModalOption icon={<span />} label="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a link when href is provided', () => {
    render(
      <ModalOption
        icon={<span />}
        label="Gmail"
        href="https://mail.google.com"
        onClick={jest.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /gmail/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://mail.google.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls onClick on link click', () => {
    const onClick = jest.fn();
    render(
      <ModalOption
        icon={<span />}
        label="Gmail"
        href="https://mail.google.com"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render sublabel when omitted', () => {
    render(<ModalOption icon={<span />} label="Copy Link" onClick={jest.fn()} />);
    expect(screen.queryByText('Send via email')).not.toBeInTheDocument();
  });

  it('renders icon content', () => {
    render(
      <ModalOption
        icon={<span data-testid="my-icon" />}
        label="Test"
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByTestId('my-icon')).toBeInTheDocument();
  });
});
