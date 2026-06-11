import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ConnectNowPage, {
  CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL,
  CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES,
} from './ConnectNowPage';

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
    expect(screen.getByRole('heading', { level: 1, name: /contractor checklist/i })).toBeInTheDocument();
    expect(screen.getByText(/find a contractor/i)).toBeInTheDocument();

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

  it('renders a back-to-results button (not water heater rebates)', () => {
    renderConnectNow();
    const backButton = screen.getByTestId('back-to-results-button');
    expect(backButton).toHaveTextContent(/back to results/i);
    expect(backButton).not.toHaveTextContent(/water heater/i);
  });

  it('renders the interstitial text between the two CTAs', () => {
    renderConnectNow();
    expect(
      screen.getByText(/if you are unable to find someone in your area/i),
    ).toBeInTheDocument();
  });

  it('renders the contractor guide in a paged viewer showing the first page image', () => {
    renderConnectNow();
    const firstPage = screen.getByRole('img', { name: /how to find a good hvac contractor/i });
    expect(firstPage).toHaveAttribute('src', CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES[0]);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('points the viewer Print action at the real PDF', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderConnectNow();
    screen.getByRole('button', { name: /print/i }).click();
    expect(openSpy).toHaveBeenCalledWith(CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('renders the PDF section heading with Electrify Now attribution', () => {
    renderConnectNow();
    expect(
      screen.getByRole('heading', { level: 2, name: /electrify now/i }),
    ).toBeInTheDocument();
  });
});
