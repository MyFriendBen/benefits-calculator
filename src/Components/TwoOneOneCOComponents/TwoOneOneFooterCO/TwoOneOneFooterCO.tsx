import { Paper, Stack, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import chatIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/chatIcon.png';
import dialIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/dialIcon.png';
import textIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/textIcon.png';
import { FormattedMessage, useIntl } from 'react-intl';
import './TwoOneOneFooterCO.css';
import { useLocalizedLink } from '../../Config/configHook';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { telHref } from '../../Referrer/footerPhone';

const TwoOneOneFooterCO = () => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const { getReferrer } = useContext(Context);
  const footerPhone = getReferrer('footerPhone', '');

  const twoOneOneChatALProps = {
    id: 'twoOneOneFooter.chatAL',
    defaultMessage: '211 chat link',
  };
  const twoOneOneDialALProps = {
    id: 'twoOneOneFooter.dialAL',
    defaultMessage: '211 dial link',
  };
  const twoOneOneTOSALProps = {
    id: 'twoOneOneFooter.termsOfSvcAL',
    defaultMessage: '211 terms of service',
  };

  const displayChatStack = () => {
    return (
      <Stack direction="row" gap="1rem">
        <img src={chatIcon} className="twoOneOne-footer-icon" alt="chat with a 2-1-1 navigator" />
        <Box>
          <Typography className="icon-header">
            <FormattedMessage id="footer-chat-text" defaultMessage="Chat" />
          </Typography>
          <Link
            href="https://www.211colorado.org/chat/#english"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneChatALProps)}
            color="primary"
          >
            <FormattedMessage id="footer-liveChat-text" defaultMessage="Click to live chat with a 2-1-1 Navigator" />
          </Link>
        </Box>
      </Stack>
    );
  };

  const displayDialStack = () => {
    return (
      <Stack direction="row" gap="1rem">
        <img src={dialIcon} className="twoOneOne-footer-icon" alt="talk to a 2-1-1 navigator via phone" />
        <Box>
          <Typography className="icon-header">
            <FormattedMessage id="footer-dial-text" defaultMessage="Dial" />
          </Typography>
          <Link
            href="tel:211"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneDialALProps)}
            color="primary"
            sx={{ display: 'inline-block' }}
          >
            <FormattedMessage id="footer-dial-text" defaultMessage="Dial " />
            2-1-1
          </Link>
          {footerPhone && (
            <>
              &nbsp;
              <Typography className="font-color" sx={{ display: 'inline-block' }}>
                <FormattedMessage id="footer-or-text" defaultMessage=" or" />
                &nbsp;
              </Typography>
              <Link
                href={telHref(footerPhone)}
                underline="none"
                target="_blank"
                aria-label={intl.formatMessage(twoOneOneDialALProps)}
                color="primary"
                sx={{ display: 'inline-block' }}
              >
                {footerPhone}
              </Link>
              <Typography className="font-color">
                <FormattedMessage id="footer-tollFree-text" defaultMessage="toll free" />
              </Typography>
            </>
          )}
        </Box>
      </Stack>
    );
  };

  const displayTextStack = () => {
    return (
      <Stack direction="row" gap="1rem">
        <img src={textIcon} className="twoOneOne-footer-icon" alt="text with a 2-1-1 navigator" />
        <Box>
          <Typography className="icon-header">
            <FormattedMessage id="footer-text-text" defaultMessage="Text " />
          </Typography>
          <Typography className="font-color displayInline">
            <FormattedMessage id="footer-text-text" defaultMessage="Text" />
          </Typography>
          &nbsp;
          <strong className="font-color">ZIP CODE</strong>
          &nbsp;
          <Typography className="font-color displayInline">
            <FormattedMessage id="footer-to-text" defaultMessage="to" />
          </Typography>
          &nbsp;
          <Link
            href="sms:898211"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneDialALProps)}
            color="primary"
            className="font-weight"
          >
            898-211*
          </Link>
          <Typography sx={{ marginTop: '1rem' }} className="font-color">
            <FormattedMessage
              id="footer-standardMsg-text"
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
          id="footer-first-paragraph"
          defaultMessage="Services found within search results may involve eligibility criteria. Please contact the resource directly to find out more information about how to obtain these services. This site contains links to other sites. All of the information provided is believed to be accurate and reliable. However, 2-1-1 Colorado assumes no responsibility for any errors appearing, nor for the use of the information provided."
        />
      </Typography>
    );
  };

  const displaySecondParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-second-paragraph"
          defaultMessage="2-1-1 Colorado is committed to helping Colorado citizens connect with the services they need. Whether by phone
        or internet, our goal is to present accurate, well-organized and easy-to-find information from state and local
        health and human services programs. We accomplish this through the work of our four Area Information Centers
        across the state. No matter where you live in Colorado, you can dial 2-1-1 and find information about resources
        in your local community. Whether you need help finding food or housing, child care, crisis counseling or
        substance abuse treatment, one number is all you need to know."
        />
      </Typography>
    );
  };

  const displayCopyrightPolicySection = () => {
    return (
      <Box className="twoOneOne-font flexIntoRow copyright-container">
        <Typography className="privacy-policy-links">
          <FormattedMessage id="footer-copyright" defaultMessage="© Copyright 2-1-1 Colorado" />
        </Typography>
        <Box className="flexLinksIntoRow">
          <Link
            href="https://www.211colorado.org/terms-of-service/"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneTOSALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-terms-of-service-link" defaultMessage="2-1-1 Terms of Service |" />
            &nbsp;
          </Link>
          <Link
            href="https://www.211colorado.org/privacy-policy/"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneTOSALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-twoOneOne-privacy" defaultMessage="2-1-1 Privacy Policy |" />
            &nbsp;
          </Link>
          <Link
            href={privacyPolicyLink}
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneTOSALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-twoOneOne-mfb" defaultMessage="MyFriendBen Privacy Policy" />
          </Link>
        </Box>
      </Box>
    );
  };

  return (
    <footer>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef' }} className="paper-container" square={true}>
        <Box className="twoOneOne-font flexIntoRow getHelp-text">
          <FormattedMessage
            id="footer-header"
            defaultMessage="Not finding what you are looking for? Try these other ways to get help:"
          />
        </Box>
        <Box className="flexIntoRow icon-section">
          {displayDialStack()}
          {displayTextStack()}
          {displayChatStack()}
        </Box>
      </Paper>
      <Box className="flexIntoRow footer-paragraph first-paragraph">{displayFirstParagraph()}</Box>
      <Box className="flexIntoRow footer-paragraph second-paragraph">{displaySecondParagraph()}</Box>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef', padding: '1rem 1rem' }} square={true}>
        {displayCopyrightPolicySection()}
      </Paper>
    </footer>
  );
};

export default TwoOneOneFooterCO;
