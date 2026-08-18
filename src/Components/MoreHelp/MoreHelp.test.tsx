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
  // Nested under the Immediate Help tab (isStandalonePage unset), the results page
  // supplies its own top-level heading, so "Other Resources Near You" must not also be
  // an <h1> — that would give the page two level-1 headings.
  it('renders the header as an h2 when nested in the tab (default)', () => {
    renderWithProviders();

    expect(screen.getByRole('heading', { level: 2, name: 'Other Resources Near You' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  // CESN's standalone /results/more-help page (see Results.tsx) has no tab bar and no
  // other heading, so this is the page's only top-level heading and must be an <h1>.
  it('renders the header as an h1 on the standalone page', () => {
    renderWithProviders(true);

    expect(screen.getByRole('heading', { level: 1, name: 'Other Resources Near You' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});
