import { Paper } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocalizedLink } from '../../Config/configHook';
import '../../Footer/PoweredByFooter.css';
import './Footer.css';
import { renderLogoSource } from '../../Referrer/referrerDataInfo';

const CESN_ACCESSIBILITY_URL = 'https://www.colorado.gov/accessibility';

export default function EnergyCalculatorFooter() {
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const intl = useIntl();

  const doraLogo = renderLogoSource(
    'CESN_DORA_Color',
    intl.formatMessage({
      id: 'cesnFooter.doraLogo.alt',
      defaultMessage: 'Colorado Department of Regulatory Agencies logo',
    }),
    'cesn-footer-dora-logo',
  );
  const mfbLogo = renderLogoSource(
    'PoweredByLogo',
    intl.formatMessage({ id: 'poweredByFooter.logo.alt', defaultMessage: 'Powered by MyFriendBen' }),
    'logo powered-by-footer-logo',
  );
  const raLogo = renderLogoSource(
    'RewiringAmericaLogo',
    intl.formatMessage({ id: 'cesnFooter.raLogo.alt', defaultMessage: 'Rewiring America logo' }),
    'logo powered-by-footer-logo',
  );
  const mfbUrl =
    'https://screener.myfriendben.org/co/step-1?referrer=energy_calculator&utm_source=cesn&utm_medium=web&utm_campaign=cesn&utm_id=cesn';
  const raUrl =
    'https://homes.rewiringamerica.org/calculator?utm_source=cesn&utm_medium=web&utm_campaign=cesn&utm_id=cesn';

  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: 'var(--footer-color)' }} square={true}>
        <div className="cesn-footer-content">
          <div className="cesn-footer-branding">
            {doraLogo}
            <div className="energy-calculator-footer-logo-container">
              <a href={mfbUrl} target="_blank">
                {mfbLogo}
              </a>
              <a href={raUrl} target="_blank">
                {raLogo}
              </a>
            </div>
          </div>
          <div className="cesn-footer-links">
            <a href={privacyPolicyLink} target="_blank" className="policy-link">
              <FormattedMessage id="footer.privacyPolicy" defaultMessage="Privacy Policy" />
            </a>
            <a href={CESN_ACCESSIBILITY_URL} target="_blank" className="policy-link">
              <FormattedMessage id="cesnFooter.accessibilityStatement" defaultMessage="Accessibility Statement" />
            </a>
            <p className="cesn-footer-copyright">
              &copy; {currentYear}{' '}
              <FormattedMessage id="cesnFooter.copyright" defaultMessage="State of Colorado" />
            </p>
          </div>
        </div>
      </Paper>
    </footer>
  );
}
