import { Paper, Stack, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import dialIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/dialIcon.png';
import textIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/textIcon.png';
import { FormattedMessage, useIntl } from 'react-intl';
import './TwoOneOneFooterIL.css';
import { useLocalizedLink } from '../../Config/configHook';

const TwoOneOneFooterIL = () => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');

  const twoOneOneDialALProps = {
    id: 'twoOneOneFooterIL.dialAL',
    defaultMessage: '211 Illinois dial link',
  };
  const twoOneOneSmsALProps = {
    id: 'twoOneOneFooterIL.smsAL',
    defaultMessage: '211 Illinois text link',
  };
  const twoOneOneTOSALProps = {
    id: 'twoOneOneFooterIL.termsOfSvcAL',
    defaultMessage: '211 Illinois terms of service',
  };
  const twoOneOnePrivacyALProps = {
    id: 'twoOneOneFooterIL.privacyAL',
    defaultMessage: '211 Illinois privacy policy',
  };
  const twoOneOneMFBPrivacyALProps = {
    id: 'twoOneOneFooterIL.mfbPrivacyAL',
    defaultMessage: 'MyFriendBen privacy policy',
  };

  const displayDialStack = () => {
    return (
      <Stack direction="row" gap="1rem">
        <img src={dialIcon} className="twoOneOneIL-footer-icon" alt="talk to a 2-1-1 navigator via phone" />
        <Box>
          <Typography className="il-icon-header">
            <FormattedMessage id="footerIL-dial-header" defaultMessage="Dial" />
          </Typography>
          <Link
            href="tel:211"
            underline="none"
            aria-label={intl.formatMessage(twoOneOneDialALProps)}
            color="primary"
            sx={{ display: 'inline-block' }}
          >
            <FormattedMessage id="footerIL-dial-text" defaultMessage="Dial " />
            2-1-1
          </Link>
        </Box>
      </Stack>
    );
  };

  const displayTextStack = () => {
    return (
      <Stack direction="row" gap="1rem">
        <img src={textIcon} className="twoOneOneIL-footer-icon" alt="text with a 2-1-1 navigator" />
        <Box>
          <Typography className="il-icon-header">
            <FormattedMessage id="footerIL-text-header" defaultMessage="Text" />
          </Typography>
          <Typography className="il-font-color il-displayInline">
            <FormattedMessage id="footerIL-text-text" defaultMessage="Text" />
          </Typography>
          &nbsp;
          <strong className="il-font-color">ZIP CODE</strong>
          &nbsp;
          <Typography className="il-font-color il-displayInline">
            <FormattedMessage id="footerIL-to-text" defaultMessage="to" />
          </Typography>
          &nbsp;
          <Link
            href="sms:898211"
            underline="none"
            aria-label={intl.formatMessage(twoOneOneSmsALProps)}
            color="primary"
            className="il-font-weight"
          >
            898-211*
          </Link>
          <Typography sx={{ marginTop: '1rem' }} className="il-font-color">
            <FormattedMessage
              id="footerIL-standardMsg-text"
              defaultMessage="*Standard message and data rates may apply."
            />
          </Typography>
        </Box>
      </Stack>
    );
  };

  const displayFirstParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footerIL-first-paragraph"
          defaultMessage="Services found within search results may involve eligibility criteria. Please contact the resource directly to find out more information about how to obtain these services. This site contains links to other sites. All of the information provided is believed to be accurate and reliable. However, 2-1-1 Illinois assumes no responsibility for any errors appearing, nor for the use of the information provided."
        />
      </Typography>
    );
  };

  const displaySecondParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footerIL-second-paragraph"
          defaultMessage="2-1-1 Illinois is committed to helping Illinois citizens connect with the services they need. Whether by phone or internet, our goal is to present accurate, well-organized and easy-to-find information from state and local health and human services programs. No matter where you live in Illinois, you can dial 2-1-1 and find information about resources in your local community. Whether you need help finding food or housing, child care, crisis counseling or substance abuse treatment, one number is all you need to know."
        />
      </Typography>
    );
  };

  const displayCopyrightPolicySection = () => {
    return (
      <Box className="twoOneOneIL-font il-flexIntoRow il-copyright-container">
        <Typography className="il-privacy-policy-links">
          <FormattedMessage id="footerIL-copyright" defaultMessage={'\u00A9 2026 2-1-1 Illinois. All Rights Reserved'} />
        </Typography>
        <Box className="il-flexLinksIntoRow">
          <Link
            href="https://211illinois.org/terms-of-service/"
            underline="none"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={intl.formatMessage(twoOneOneTOSALProps)}
            className="il-privacy-policy-links"
          >
            <FormattedMessage id="footerIL-terms-of-service-link" defaultMessage="2-1-1 Illinois Terms of Service |" />
            &nbsp;
          </Link>
          <Link
            href="https://211illinois.org/privacy-policy/"
            underline="none"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={intl.formatMessage(twoOneOnePrivacyALProps)}
            className="il-privacy-policy-links"
          >
            <FormattedMessage id="footerIL-twoOneOne-privacy" defaultMessage="2-1-1 Illinois Privacy Policy |" />
            &nbsp;
          </Link>
          <Link
            href={privacyPolicyLink}
            underline="none"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={intl.formatMessage(twoOneOneMFBPrivacyALProps)}
            className="il-privacy-policy-links"
          >
            <FormattedMessage id="footerIL-twoOneOne-mfb" defaultMessage="MyFriendBen Privacy Policy" />
          </Link>
        </Box>
      </Box>
    );
  };

  return (
    <footer>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef' }} className="il-paper-container" square={true}>
        <Box className="twoOneOneIL-font il-flexIntoRow il-getHelp-text">
          <FormattedMessage
            id="footerIL-header"
            defaultMessage="Not finding what you are looking for? Try these other ways to get help:"
          />
        </Box>
        <Box className="il-flexIntoRow il-icon-section">
          {displayDialStack()}
          {displayTextStack()}
        </Box>
      </Paper>
      <Box className="il-flexIntoRow il-footer-paragraph il-first-paragraph">{displayFirstParagraph()}</Box>
      <Box className="il-flexIntoRow il-footer-paragraph il-second-paragraph">{displaySecondParagraph()}</Box>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef', padding: '1rem 1rem' }} square={true}>
        {displayCopyrightPolicySection()}
      </Paper>
    </footer>
  );
};

export default TwoOneOneFooterIL;
