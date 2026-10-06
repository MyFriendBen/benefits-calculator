import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import MoreHelp from './MoreHelp';

jest.mock('../Config/configHook', () => ({
  useConfig: () => ({ moreHelpOptions: [] }),
}));

const renderWithProviders = (isStandalonePage?: boolean) => {
  return render(
    <MemoryRouter>
      <IntlProvider locale="en" defaultLocale="en">
        <MoreHelp isStandalonePage={isStandalonePage} />
      </IntlProvider>
    </MemoryRouter>,
  );
};

describe('MoreHelp', () => {
  // Nested in the tab (isStandalonePage unset), the results page already has its own
  // h1, so this must not be a second one.
  it('renders the header as an h2 when nested in the tab (default)', () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { level: 2, name: 'Other Resources Near You' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  // CESN's standalone page (see Results.tsx) has no other heading, so this one must
  // be the h1.
  it('renders the header as an h1 on the standalone page', () => {
    renderWithProviders(true);

    expect(screen.getByRole('heading', { level: 1, name: 'Other Resources Near You' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});
