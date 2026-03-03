import { Paper, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import { FormattedMessage, useIntl } from 'react-intl';
import './LancFooter.css';
import { useLocalizedLink } from '../../Config/configHook';
import Footer from '../../Footer/Footer';

const LancFooter = () => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const termsAndConditionsLink = useLocalizedLink('consent_to_contact');

  const lancPrivacyPolicyALProps = {
    id: 'lancFooter.lancPrivacyPolicyAL',
    defaultMessage: 'LANC Privacy Policy',
  };

  const mfbPrivacyPolicyALProps = {
    id: 'lancFooter.mfbPrivacyPolicyAL',
    defaultMessage: 'MyFriendBen Privacy Policy',
  };

  const mfbTermsALProps = {
    id: 'lancFooter.mfbTermsAL',
    defaultMessage: 'MyFriendBen Terms & Conditions',
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
        <Link
          href="https://legalaidnc.org/privacy-policy-2/"
          underline="none"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={intl.formatMessage(lancPrivacyPolicyALProps)}
          className="privacy-policy-links"
        >
          <FormattedMessage id="footer-lanc-privacy" defaultMessage="LANC Privacy Policy" />
          &nbsp;
        </Link>
        <Box className="flex-row-links">
          <Link
            href={privacyPolicyLink}
            underline="none"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={intl.formatMessage(mfbPrivacyPolicyALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-lanc-mfb" defaultMessage="MyFriendBen Privacy Policy" />
          </Link>
          <Link
            href={termsAndConditionsLink}
            underline="none"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={intl.formatMessage(mfbTermsALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-lanc-mfb-terms" defaultMessage={'\u00A0| MyFriendBen Terms & Conditions'} />
          </Link>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Box className="flex-row footer-paragraph first-paragraph">{displayFirstParagraph()}</Box>
      <Box className="flex-row footer-paragraph second-paragraph">{displaySecondParagraph()}</Box>
      <Footer hideServiceLinks={true} />
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef', padding: '1rem 1rem' }} square={true}>
        {displayCopyrightPolicySection()}
      </Paper>
    </>
  );
};

export default LancFooter;
