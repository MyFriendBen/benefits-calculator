import { FormattedMessage, useIntl } from 'react-intl';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LeftArrowIcon from '@mui/icons-material/KeyboardArrowLeft';
import { Typography } from '@mui/material';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import PagedDocumentViewer from '../../../Common/PagedDocumentViewer';
import { usePageTitle } from '../../../Common/usePageTitle';
import { OTHER_PAGE_TITLES } from '../../../../Assets/pageTitleTags';
import { addAdminToLink } from '../../../../Assets/adminLink';
import { useTrackEvent } from '../../../../Assets/analytics';
import { Icon } from '../../../Icon/Icon';
import './ConnectNowPage.css';

const CONTRACTOR_FINDER_URL = 'https://contractors.poweraheadcolorado.org/contractor-finder?utm_source=cesn' as const;

const EXPAND_SEARCH_URL = 'https://app.hvacree.net/LoveElectric' as const;

const CONTRACTOR_GUIDE_BASE_URL = `${process.env.PUBLIC_URL}/documents/heat-pump-journey` as const;

/**
 * Translated editions of the "How to find a good HVAC contractor" guide (Electrify
 * Now), keyed by language subtag. cesn offers a dozen languages but only these
 * editions exist, so every other locale falls back to English.
 *
 * Each key is also a directory under `public/documents/heat-pump-journey/` holding
 * the PDF plus one pre-rendered page image per page — see
 * `public/documents/README.md`, and update `pageCount` if a PDF's page count
 * changes.
 */
const CONTRACTOR_GUIDE_EDITIONS = {
  en: { pageCount: 3 },
  es: { pageCount: 3 },
} as const;

type ContractorGuideLanguage = keyof typeof CONTRACTOR_GUIDE_EDITIONS;

const CONTRACTOR_GUIDE_LANGUAGES = Object.keys(CONTRACTOR_GUIDE_EDITIONS) as ContractorGuideLanguage[];

const CONTRACTOR_GUIDE_FALLBACK_LANGUAGE: ContractorGuideLanguage = 'en';

/**
 * Guide assets for `locale`, matched on its language subtag ('es-mx' → 'es',
 * 'en-us' → 'en').
 *
 * The PagedDocumentViewer displays the pre-rendered page images (so the
 * toolbar/pager can match the design); Print/Download opens the PDF so users get
 * a real PDF.
 */
export function getContractorGuideAssets(locale: string) {
  const subtag = locale.toLowerCase().split('-')[0];
  const language =
    CONTRACTOR_GUIDE_LANGUAGES.find((edition) => edition === subtag) ?? CONTRACTOR_GUIDE_FALLBACK_LANGUAGE;
  const { pageCount } = CONTRACTOR_GUIDE_EDITIONS[language];

  return {
    pdfUrl: `${CONTRACTOR_GUIDE_BASE_URL}/${language}/contractor-checklist.pdf`,
    pageImages: Array.from(
      { length: pageCount },
      (_, i) => `${CONTRACTOR_GUIDE_BASE_URL}/${language}/page-${i + 1}.png`,
    ),
  };
}

export default function ConnectNowPage() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { whiteLabel, uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams]);
  const track = useTrackEvent();

  const backLink = addAdminToLink(`/${whiteLabel}/${uuid}/results/energy-rebates/hvac`, isAdminView);

  usePageTitle(OTHER_PAGE_TITLES.energyCalculatorConnectNow);

  const pdfDocumentTitle = intl.formatMessage({
    id: 'energyCalculator.connectNow.pdfDocumentTitle',
    defaultMessage: 'How to find a good HVAC contractor',
  });

  const pdfSectionHeadingId = 'connect-now-pdf-heading';

  const contractorGuide = useMemo(() => getContractorGuideAssets(intl.locale), [intl.locale]);

  // Reaching this page is the denominator for the two contractor-search clicks;
  // the guide viewer renders here too, so it's also the denominator for the PDF.
  useEffect(() => {
    track('heat_pump_section_view', { section: 'find_contractor' });
    track('heat_pump_section_view', { section: 'contractor_pdf' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="benefits-form connect-now-page">
      <div className="connect-now-back-row results-back-save-btn-container">
        <button
          data-testid="back-to-results-button"
          className="results-back-save-buttons"
          onClick={() => navigate(backLink)}
          aria-label={intl.formatMessage({
            id: 'energyCalculator.connectNow.backToResults',
            defaultMessage: 'BACK TO RESULTS',
          })}
        >
          <div className="btn-icon-text-container padding-right">
            <LeftArrowIcon />
            <FormattedMessage id="energyCalculator.connectNow.backToResults" defaultMessage="BACK TO RESULTS" />
          </div>
        </button>
      </div>

      <header className="connect-now-header">
        <Icon name="wrench" aria-hidden="true" className="connect-now-icon" />
        <div className="connect-now-header-text">
          <span className="connect-now-title-text">
            <FormattedMessage id="energyCalculator.connectNow.eyebrow" defaultMessage="Find a Contractor" />
          </span>
          <hr className="connect-now-separator" />
          <h1 className="connect-now-subtitle">
            <FormattedMessage id="energyCalculator.connectNow.subtitle" defaultMessage="Contractor Checklist" />
          </h1>
        </div>
      </header>

      <Typography variant="body1" className="connect-now-intro energy-calculator-body-text">
        <FormattedMessage
          id="energyCalculator.connectNow.intro"
          defaultMessage="Based on what you've shared about your location and utility provider(s), we recommend starting your search with Power Ahead Colorado. This tool, from the Denver Regional Council of Governments, can help you find and compare contractors by Google reviews, services offered, service area, and more."
        />
      </Typography>

      <section
        className="connect-now-ctas"
        aria-label={intl.formatMessage({
          id: 'energyCalculator.connectNow.ctasSectionAria',
          defaultMessage: 'Contractor search links',
        })}
      >
        <TrackedOutboundLink
          href={CONTRACTOR_FINDER_URL}
          action="heat_pump_connect_now_find_installer"
          label="Power Ahead Colorado Contractor Finder"
          category="heat_pump_journey"
          className="connect-now-cta"
        >
          <FormattedMessage id="energyCalculator.connectNow.cta.findInstaller" defaultMessage="Find an installer" />
          <OpenInNewIcon className="connect-now-cta-icon" aria-hidden="true" />
        </TrackedOutboundLink>
        <Typography variant="body1" className="connect-now-cta-interstitial">
          <FormattedMessage
            id="energyCalculator.connectNow.cta.interstitial"
            defaultMessage="If you are unable to find someone in your area, try an expanded search."
          />
        </Typography>
        <TrackedOutboundLink
          href={EXPAND_SEARCH_URL}
          action="heat_pump_connect_now_expand_search"
          label="Love Electric HVACREE expand search"
          category="heat_pump_journey"
          className="connect-now-cta"
        >
          <FormattedMessage id="energyCalculator.connectNow.cta.expandSearch" defaultMessage="Expand search" />
          <OpenInNewIcon className="connect-now-cta-icon" aria-hidden="true" />
        </TrackedOutboundLink>
      </section>

      <section className="connect-now-pdf-section" aria-labelledby={pdfSectionHeadingId}>
        <Typography id={pdfSectionHeadingId} variant="h2" component="h2" className="connect-now-pdf-heading">
          <FormattedMessage
            id="energyCalculator.connectNow.pdfSectionHeading"
            defaultMessage="How to find a good HVAC contractor, from Electrify Now."
          />
        </Typography>
        <PagedDocumentViewer
          pageImages={contractorGuide.pageImages}
          pdfUrl={contractorGuide.pdfUrl}
          title={pdfDocumentTitle}
          className="connect-now-pdf-frame"
          // Fires on every page change (the viewer only calls this on navigation,
          // so it captures each turn); the PDF-opened denominator is the
          // contractor_pdf section_view above.
          onPageView={(n) => track('heat_pump_pdf_page', { page_number: n })}
          onPrint={() => track('heat_pump_pdf_print', {})}
        />
      </section>
    </main>
  );
}
