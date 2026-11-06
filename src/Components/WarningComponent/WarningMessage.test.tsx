import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import WarningMessage from './WarningMessage';
import { WarningMsg } from '../../Types/Results';

const translation = (label: string, default_message: string) => ({ label, default_message });

const warning = (message: string): WarningMsg => ({
  message: translation('warning.test', message),
  link_url: translation('warning.test.url', ''),
  link_text: translation('warning.test.link', ''),
  legal_statuses: [],
});

const renderWarning = (message: string) =>
  render(
    <IntlProvider locale="en" defaultLocale="en" onError={() => {}}>
      <WarningMessage warning={warning(message)} />
    </IntlProvider>,
  );

describe('WarningMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 23));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fills in the tax year placeholders without number formatting', () => {
    renderWarning('These results are for the {priorYear} tax year, due April 15, {currentYear}.');

    expect(screen.getByText('These results are for the 2025 tax year, due April 15, 2026.')).toBeInTheDocument();
  });

  it('rolls the years over on January 1', () => {
    jest.setSystemTime(new Date(2027, 0, 1));
    renderWarning('For the {priorYear} tax year.');

    expect(screen.getByText('For the 2026 tax year.')).toBeInTheDocument();
  });

  it('renders a warning without placeholders unchanged', () => {
    renderWarning('Apply at your county office.');

    expect(screen.getByText('Apply at your county office.')).toBeInTheDocument();
  });
});
