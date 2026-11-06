import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Context } from '../../Wrapper/Wrapper';
import TwoOneOneFooterNC from './TwoOneOneFooterNC';

jest.mock('../../Config/configHook', () => ({
  useLocalizedLink: () => 'https://example.org/privacy',
}));

const renderWithFooterPhone = (footerPhone: string) => {
  const getReferrer = (key: string, defaultValue?: unknown) => (key === 'footerPhone' ? footerPhone : defaultValue);

  return render(
    <IntlProvider locale="en" defaultLocale="en">
      <Context.Provider value={{ getReferrer } as any}>
        <TwoOneOneFooterNC />
      </Context.Provider>
    </IntlProvider>,
  );
};

describe('TwoOneOneFooterNC', () => {
  it('dials the configured number it displays', () => {
    renderWithFooterPhone('1-(888)-892-1162');

    expect(screen.getByText('1-(888)-892-1162').closest('a')).toHaveAttribute('href', 'tel:18888921162');
  });

  it('shows the configured number in the paragraph text', () => {
    renderWithFooterPhone('1-555-010-0199');

    expect(screen.getByText(/can call 2-1-1 or 1-555-010-0199 to receive/)).toBeInTheDocument();
  });

  it('hides the toll-free link when no number is configured, keeping Dial 2-1-1', () => {
    const { container } = renderWithFooterPhone('');

    expect(screen.queryByText(/toll free/i)).not.toBeInTheDocument();
    expect(container.querySelector('a[href="tel:211"]')).toBeInTheDocument();
  });
});
