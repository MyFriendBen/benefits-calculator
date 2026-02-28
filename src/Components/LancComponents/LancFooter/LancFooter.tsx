import { Paper, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import { FormattedMessage, useIntl } from 'react-intl';
import './LancFooter.css';
import { useLocalizedLink } from '../../Config/configHook';
import Footer from '../../Footer/Footer';

const LancFooter = () => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');

  const lancTOSALProps = {
    id: 'lancFooter.termsOfSvcAL',
    defaultMsg: 'LANC terms of service',
  };

  const displayFirstParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-first-paragraph-lanc"
          defaultMessage="Services found within search results may involve eligibility criteria. Please contact the resource directly to find out more information about how to obtain these services. This site contains links to other sites. All of the information provided is believed to be accurate and reliable. However, Legal Aid of North Carolina assumes no responsibility for any errors appearing, nor for the use of the information provided."
        />
      </Typography>
    );
  };

  const displaySecondParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-second-paragraph-lanc"
          defaultMessage="MyFriendBen is for informational and educational purposes only. It does not provide legal advice and is not an application for services or benefits. Using the benefit screener or submitting information through MyFriendBen does not create an attorney-client relationship with Legal Aid of North Carolina. Legal Aid of North Carolina is not responsible for any errors or for how the information is used. If you need legal advice about your specific situation, please contact Legal Aid of North Carolina or a private attorney."
        />
      </Typography>
    );
  };

  const displayCopyrightPolicySection = () => {
    return (
      <Box className="lanc-font flex-row copyright-container">
        <Typography className="privacy-policy-links">
          <FormattedMessage id="footer-copyright-lanc" defaultMessage="© Copyright LANC North Carolina" />
        </Typography>
        <Box className="flex-row-links">
          <Link
            href="https://legalaidnc.org/privacy-policy-2/"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(lancTOSALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-lanc-privacy" defaultMessage="LANC Privacy Policy |" />
            &nbsp;
          </Link>
          <Link
            href={privacyPolicyLink}
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(lancTOSALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-lanc-mfb" defaultMessage="MyFriendBen Privacy Policy" />
          </Link>
        </Box>
      </Box>
    );
  };

  return (
    <footer>
      <>
        <Box className="flex-row footer-paragraph first-paragraph">{displayFirstParagraph()}</Box>
        <Box className="flex-row footer-paragraph second-paragraph">{displaySecondParagraph()}</Box>
        <Footer hideServiceLinks={true} />
      </>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef', padding: '1rem 1rem' }} square={true}>
        {displayCopyrightPolicySection()}
      </Paper>
    </footer>
  );
};

export default LancFooter;
