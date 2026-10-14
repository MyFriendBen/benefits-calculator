import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import ExternalApiFailureBanner from './ExternalApiFailureBanner';

// The backend lists every external service that failed while computing results
// (`external_api_failures`). Any entry means some programs may be missing, so the
// banner shows one generic message whichever service it was.
let mockExternalApiFailures: string[] = [];

jest.mock('../Results', () => ({
  useResultsContext: () => ({ externalApiFailures: mockExternalApiFailures }),
}));

const BANNER_TEXT = /You may be eligible for more programs than those listed/i;

const renderBanner = (failures: string[]) => {
  mockExternalApiFailures = failures;
  return render(
    <IntlProvider locale="en" messages={{}}>
      <ExternalApiFailureBanner />
    </IntlProvider>,
  );
};

describe('ExternalApiFailureBanner', () => {
  it('shows when PolicyEngine failed', () => {
    renderBanner(['policy_engine']);

    expect(screen.getByRole('alert')).toHaveTextContent(BANNER_TEXT);
  });

  it('shows when HUD failed', () => {
    renderBanner(['hud']);

    expect(screen.getByRole('alert')).toHaveTextContent(BANNER_TEXT);
  });

  it('shows once when several services failed', () => {
    renderBanner(['hud', 'policy_engine']);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('shows for a service id it has no specific copy for', () => {
    renderBanner(['some_future_service']);

    expect(screen.getByRole('alert')).toHaveTextContent(BANNER_TEXT);
  });

  it('renders nothing when every service answered', () => {
    const { container } = renderBanner([]);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
