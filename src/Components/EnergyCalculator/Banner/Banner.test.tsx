import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import CesnBanner from './Banner';

jest.mock('../../Referrer/referrerDataInfo', () => ({
  renderLogoSource: (_key: string, alt: string, className: string) => (
    <img src="test-logo.png" alt={alt} className={className} />
  ),
}));

const renderBanner = () =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <CesnBanner />
    </IntlProvider>,
  );

describe('CesnBanner', () => {
  it('renders the official website text', () => {
    renderBanner();
    expect(screen.getByText(/An official website of the State of Colorado/i)).toBeInTheDocument();
  });

  it('renders the Colorado logo', () => {
    renderBanner();
    expect(screen.getByAltText('State of Colorado logo')).toBeInTheDocument();
  });

  it('renders the toggle button', () => {
    renderBanner();
    expect(screen.getByRole('button', { name: /here's how you know/i })).toBeInTheDocument();
  });

  it('hides the dropdown by default', () => {
    renderBanner();
    expect(screen.queryByText(/Official websites use \.gov/i)).not.toBeInTheDocument();
  });

  it('shows the dropdown when toggle is clicked', () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /here's how you know/i }));
    expect(screen.getByText(/Official websites use \.gov/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure \.gov websites use HTTPS/i)).toBeInTheDocument();
  });

  it('hides the dropdown when toggle is clicked again', () => {
    renderBanner();
    const toggle = screen.getByRole('button', { name: /here's how you know/i });
    fireEvent.click(toggle);
    expect(screen.getByText(/Official websites use \.gov/i)).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText(/Official websites use \.gov/i)).not.toBeInTheDocument();
  });

  it('sets aria-expanded correctly on the toggle', () => {
    renderBanner();
    const toggle = screen.getByRole('button', { name: /here's how you know/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
