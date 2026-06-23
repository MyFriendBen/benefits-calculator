import { FormattedMessage, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LeftArrowIcon from '@mui/icons-material/KeyboardArrowLeft';
import { Typography } from '@mui/material';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import PagedDocumentViewer from '../../../Common/PagedDocumentViewer';
import { usePageTitle } from '../../../Common/usePageTitle';
import { OTHER_PAGE_TITLES } from '../../../../Assets/pageTitleTags';
import { addAdminToLink } from '../../../../Assets/adminLink';
import { ReactComponent as Wrench } from '../../Icons/Wrench.svg';
import './ConnectNowPage.css';

const CONTRACTOR_FINDER_URL = 'https://contractors.poweraheadcolorado.org/contractor-finder?utm_source=cesn' as const;

const EXPAND_SEARCH_URL = 'https://app.hvacree.net/LoveElectric' as const;

/**
 * "How to find a good HVAC contractor" guide (Electrify Now), served as a static
 * asset from `public/documents/`. See `public/documents/README.md`.
 *
 * The PagedDocumentViewer displays pre-rendered page images (so the toolbar/pager
 * can match the design); Print/Download opens this PDF so users get a real PDF.
 * Regenerate the page images if this PDF changes — see the README.
 */
export const CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL =
  `${process.env.PUBLIC_URL}/documents/heat-pump-journey/ElectrifyNow_heatpumpcontractor.pdf` as const;

export const CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES = [
  `${process.env.PUBLIC_URL}/documents/heat-pump-journey/page-1.png`,
  `${process.env.PUBLIC_URL}/documents/heat-pump-journey/page-2.png`,
  `${process.env.PUBLIC_URL}/documents/heat-pump-journey/page-3.png`,
] as const;

export default function ConnectNowPage() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { whiteLabel, uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams]);

  const backLink = addAdminToLink(`/${whiteLabel}/${uuid}/results/energy-rebates/hvac`, isAdminView);

  usePageTitle(OTHER_PAGE_TITLES.energyCalculatorConnectNow);

  const pdfDocumentTitle = intl.formatMessage({
    id: 'energyCalculator.connectNow.pdfDocumentTitle',
    defaultMessage: 'How to find a good HVAC contractor',
  });

  const pdfSectionHeadingId = 'connect-now-pdf-heading';

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
        <Wrench aria-hidden="true" className="connect-now-icon" />
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
          pageImages={CONNECT_NOW_CONTRACTOR_GUIDE_PAGE_IMAGES}
          pdfUrl={CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL}
          title={pdfDocumentTitle}
          className="connect-now-pdf-frame"
        />
      </section>
    </main>
  );
}
