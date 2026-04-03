import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import EnergyCalculatorFooter from './Footer';

jest.mock('../../Referrer/referrerDataInfo', () => ({
  renderLogoSource: (_key: string, alt: string, className: string) => (
    <img src="test-logo.png" alt={alt} className={className} />
  ),
}));

jest.mock('../../Config/configHook', () => ({
  useLocalizedLink: () => 'https://example.com/privacy',
}));

const renderFooter = () =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <EnergyCalculatorFooter />
    </IntlProvider>,
  );

describe('EnergyCalculatorFooter', () => {
  it('renders the DORA logo', () => {
    renderFooter();
    expect(screen.getByAltText('Colorado Department of Regulatory Agencies logo')).toBeInTheDocument();
  });

  it('renders the MFB and Rewiring America logos', () => {
    renderFooter();
    expect(screen.getByAltText('Powered by MyFriendBen')).toBeInTheDocument();
    expect(screen.getByAltText('Rewiring America logo')).toBeInTheDocument();
  });

  it('renders the privacy policy link', () => {
    renderFooter();
    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link).toHaveAttribute('href', 'https://example.com/privacy');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders the accessibility statement link', () => {
    renderFooter();
    const link = screen.getByRole('link', { name: /accessibility statement/i });
    expect(link).toHaveAttribute('href', 'https://www.colorado.gov/accessibility');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders external partner links with rel="noreferrer"', () => {
    renderFooter();
    const links = screen.getAllByRole('link');
    const externalLinks = links.filter((link) => link.getAttribute('target') === '_blank');
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });
  });

  it('renders the copyright notice with the current year', () => {
    renderFooter();
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    expect(screen.getByText(/State of Colorado/i)).toBeInTheDocument();
  });
});
