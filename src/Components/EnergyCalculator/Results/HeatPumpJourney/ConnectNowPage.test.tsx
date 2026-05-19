import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ConnectNowPage, { CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL } from './ConnectNowPage';

function renderConnectNow() {
  return render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/cesn/test-session-uuid/results/energy-rebates/waterHeater/connect-now']}>
        <Routes>
          <Route
            path="/:whiteLabel/:uuid/results/energy-rebates/waterHeater/connect-now"
            element={<ConnectNowPage />}
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('ConnectNowPage', () => {
  it('renders heading and contractor CTAs with correct outbound URLs', () => {
    renderConnectNow();
    expect(
      screen.getByRole('heading', { level: 1, name: /find a contractor \/ contractor checklist/i }),
    ).toBeInTheDocument();

    const findInstaller = screen.getByRole('link', { name: /find an installer/i });
    expect(findInstaller).toHaveAttribute(
      'href',
      'https://contractors.poweraheadcolorado.org/contractor-finder?utm_source=cesn',
    );
    expect(findInstaller).toHaveAttribute('target', '_blank');

    const expandSearch = screen.getByRole('link', { name: /expand search/i });
    expect(expandSearch).toHaveAttribute('href', 'https://app.hvacree.net/LoveElectric');
    expect(expandSearch).toHaveAttribute('target', '_blank');
  });

  it('embeds the contractor guide PDF with an accessible iframe title', () => {
    renderConnectNow();
    expect(screen.getByTitle(/how to find a good hvac contractor \(pdf\)/i)).toHaveAttribute(
      'src',
      CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL,
    );
  });
});
