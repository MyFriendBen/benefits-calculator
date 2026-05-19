import { FormattedMessage, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Typography } from '@mui/material';
import BackAndSaveButtons from '../../../Results/BackAndSaveButtons/BackAndSaveButtons';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import EmbeddedDocumentFrame from '../../../Common/EmbeddedDocumentFrame';
import { usePageTitle } from '../../../Common/usePageTitle';
import { OTHER_PAGE_TITLES } from '../../../../Assets/pageTitleTags';
import './ConnectNowPage.css';

function addAdminToLink(link: string, isAdmin: boolean) {
  if (isAdmin) {
    return `${link}?admin=true`;
  }
  return link;
}

const CONTRACTOR_FINDER_URL =
  'https://contractors.poweraheadcolorado.org/contractor-finder?utm_source=cesn' as const;

const EXPAND_SEARCH_URL = 'https://app.hvacree.net/LoveElectric' as const;

/**
 * WIP PDF URL from the MFB-980 design doc (Linear upload). Replace with the
 * final Power Ahead / CESN asset URL when stakeholders publish it.
 */
export const CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL =
  'https://uploads.linear.app/2f6473df-05c1-41b3-9368-074f571d0e87/9e6a6dbe-5008-480a-be75-c7aea752a2e6/16b66a6e-ef7e-455f-a1d1-b92b1c6aa998' as const;

export default function ConnectNowPage() {
  const intl = useIntl();
  const { whiteLabel, uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams]);

  const backLink = addAdminToLink(
    `/${whiteLabel}/${uuid}/results/energy-rebates/waterHeater`,
    isAdminView,
  );

  usePageTitle(OTHER_PAGE_TITLES.energyCalculatorConnectNow);

  const pdfIframeTitle = intl.formatMessage({
    id: 'energyCalculator.connectNow.pdfIframeTitle',
    defaultMessage: 'How to find a good HVAC contractor (PDF)',
  });

  const pdfSectionHeadingId = 'connect-now-pdf-heading';

  return (
    <main className="benefits-form connect-now-page">
      <section className="back-to-results-button-container">
        <BackAndSaveButtons
          navigateToLink={backLink}
          BackToThisPageText={
            <FormattedMessage
              id="energyCalculator.connectNow.backToWaterHeater"
              defaultMessage="BACK TO WATER HEATER REBATES"
            />
          }
        />
      </section>

      <header className="connect-now-header">
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 600 }}>
          <FormattedMessage
            id="energyCalculator.connectNow.title"
            defaultMessage="Find a Contractor / Contractor Checklist"
          />
        </Typography>
        <Typography variant="body1" className="connect-now-intro energy-calculator-body-text" sx={{ mt: 1 }}>
          <FormattedMessage
            id="energyCalculator.connectNow.intro"
            defaultMessage="Use the tools below to search for installers, then review the checklist for what to look for in a qualified HVAC contractor for your heat pump project."
          />
        </Typography>
      </header>

      <section className="connect-now-ctas" aria-label={intl.formatMessage({ id: 'energyCalculator.connectNow.ctasSectionAria', defaultMessage: 'Contractor search links' })}>
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
        <Typography
          id={pdfSectionHeadingId}
          variant="h2"
          component="h2"
          sx={{ fontSize: { xs: '1.15rem', sm: '1.25rem' }, fontWeight: 600, mb: 1 }}
        >
          <FormattedMessage
            id="energyCalculator.connectNow.pdfSectionHeading"
            defaultMessage="How to find a good HVAC contractor"
          />
        </Typography>
        <EmbeddedDocumentFrame src={CONNECT_NOW_CONTRACTOR_GUIDE_PDF_URL} title={pdfIframeTitle} className="connect-now-pdf-frame" />
      </section>
    </main>
  );
}
