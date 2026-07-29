import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ConnectNowPage, { getContractorGuideAssets } from './ConnectNowPage';

function connectNowTree(locale: string) {
  return (
    <IntlProvider locale={locale} messages={{}}>
      <MemoryRouter initialEntries={['/cesn/test-session-uuid/results/energy-rebates/waterHeater/connect-now']}>
        <Routes>
          <Route
            path="/:whiteLabel/:uuid/results/energy-rebates/waterHeater/connect-now"
            element={<ConnectNowPage />}
          />
        </Routes>
      </MemoryRouter>
    </IntlProvider>
  );
}

function renderConnectNow(locale = 'en') {
  return render(connectNowTree(locale));
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
    expect(screen.getByText(/if you are unable to find someone in your area/i)).toBeInTheDocument();
  });

  it('renders the contractor guide in a paged viewer showing the first page image', () => {
    renderConnectNow();
    const firstPage = screen.getByRole('img', { name: /how to find a good hvac contractor/i });
    expect(firstPage).toHaveAttribute('src', getContractorGuideAssets('en').pageImages[0]);
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('points the viewer Print action at the real PDF', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderConnectNow();
    screen.getByRole('button', { name: /print/i }).click();
    expect(openSpy).toHaveBeenCalledWith(getContractorGuideAssets('en').pdfUrl, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('serves the Spanish edition of the guide when Spanish is selected', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderConnectNow('es');

    const firstPage = screen.getByRole('img', { name: /how to find a good hvac contractor/i });
    expect(firstPage).toHaveAttribute('src', expect.stringContaining('/heat-pump-journey/es/page-1.png'));

    screen.getByRole('button', { name: /print/i }).click();
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('/heat-pump-journey/es/contractor-checklist.pdf'),
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('swaps the edition when the language changes mid-read, holding the reader on the same page', () => {
    const { rerender } = renderConnectNow('en');
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));

    const guidePage = () => screen.getByRole('img', { name: /how to find a good hvac contractor/i });
    expect(guidePage()).toHaveAttribute('src', expect.stringContaining('/heat-pump-journey/en/page-2.png'));

    rerender(connectNowTree('es'));

    expect(guidePage()).toHaveAttribute('src', expect.stringContaining('/heat-pump-journey/es/page-2.png'));
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('falls back to the English guide for locales with no translated edition', () => {
    renderConnectNow('zh-hans');
    const firstPage = screen.getByRole('img', { name: /how to find a good hvac contractor/i });
    expect(firstPage).toHaveAttribute('src', expect.stringContaining('/heat-pump-journey/en/page-1.png'));
  });

  it('renders the PDF section heading with Electrify Now attribution', () => {
    renderConnectNow();
    expect(screen.getByRole('heading', { level: 2, name: /electrify now/i })).toBeInTheDocument();
  });
});

describe('getContractorGuideAssets', () => {
  it('matches on the language subtag', () => {
    expect(getContractorGuideAssets('es-mx').pdfUrl).toBe(getContractorGuideAssets('es').pdfUrl);
    expect(getContractorGuideAssets('en-us').pdfUrl).toBe(getContractorGuideAssets('en').pdfUrl);
  });

  it('returns one page image per page, in order', () => {
    expect(getContractorGuideAssets('es').pageImages).toEqual([
      expect.stringContaining('/es/page-1.png'),
      expect.stringContaining('/es/page-2.png'),
      expect.stringContaining('/es/page-3.png'),
    ]);
  });

  // Every locale in cesn's `language_options` (configuration/white_labels/cesn.py).
  // Only Spanish has a translated edition; the rest must not 404 on a missing one.
  const CESN_LOCALES = ['en-us', 'es', 'vi', 'fr', 'am', 'so', 'ru', 'ne', 'my', 'zh-hans', 'ar', 'sw'] as const;

  it.each(CESN_LOCALES.filter((locale) => locale !== 'es'))('serves the English guide for %s', (locale) => {
    const { pdfUrl, pageImages } = getContractorGuideAssets(locale);
    expect(pdfUrl).toBe(getContractorGuideAssets('en-us').pdfUrl);
    expect(pdfUrl).toContain('/heat-pump-journey/en/contractor-checklist.pdf');
    expect(pageImages).toEqual(getContractorGuideAssets('en-us').pageImages);
  });

  it('serves the Spanish guide only for Spanish', () => {
    const spanish = getContractorGuideAssets('es');
    expect(spanish.pdfUrl).toContain('/heat-pump-journey/es/contractor-checklist.pdf');

    const otherLocales = CESN_LOCALES.filter((locale) => locale !== 'es');
    expect(otherLocales.filter((locale) => getContractorGuideAssets(locale).pdfUrl === spanish.pdfUrl)).toEqual([]);
  });

  it('falls back to English for an unknown or empty locale', () => {
    const english = getContractorGuideAssets('en-us');
    expect(getContractorGuideAssets('xx-yy').pdfUrl).toBe(english.pdfUrl);
    expect(getContractorGuideAssets('').pdfUrl).toBe(english.pdfUrl);
  });
});
