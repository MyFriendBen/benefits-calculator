import Paper from '@mui/material/Paper';
import Share from '../Share/Share';
import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { useConfig, useLocalizedLink } from '../Config/configHook';
import { FormattedMessage } from 'react-intl';
import './Footer.css';
import { useLogo } from '../Referrer/useLogo';
import { FooterDataConfig } from '../../Types/Config';

const Footer = () => {
  const footerData: FooterDataConfig = useConfig('footer_data');
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const termsAndConditionsLink = useLocalizedLink('consent_to_contact');
  const context = useContext(Context);
  const { getReferrer } = context;

  // Only add the footerLogoClass if it exists in the config
  const baseLogoClass = 'logo footer-logo';
  const footerLogoClass = getReferrer('footerLogoClass', ''); // Provide empty string as fallback
  const logoClassName = footerLogoClass ? `${baseLogoClass} ${footerLogoClass}` : baseLogoClass;

  const { theme } = context;
  const { email } = footerData;

  return (
    <footer>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: theme.footerColor, color: '#ffffff' }} square={true}>
        <div className="footer-content-container">
          <div>
            {useLogo('logoFooterSource', 'logoFooterAlt', logoClassName)}
            <div className="bottom-top-margin">
              <p className="white-font italicized">
                <FormattedMessage id="footer-questions" defaultMessage="Questions? Contact" />
              </p>
              <a href={`mailto:${email}`} className="white-font italicized footer-link">
                {email}
              </a>
            </div>
          </div>
          <div className="share-container">
            <Share />
          </div>
        </div>
        <div className="footer-policy-container">
          <a href={privacyPolicyLink} target="_blank" className="policy-link">
            <FormattedMessage id="footer.privacyPolicy" defaultMessage="Privacy Policy" />
          </a>
          <a href={termsAndConditionsLink} target="_blank" className="policy-link">
            <FormattedMessage id="footer.termsAndConditions" defaultMessage="Terms and Conditions" />
          </a>
        </div>
      </Paper>
    </footer>
  );
};

export default Footer;
