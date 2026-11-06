import { Paper, Stack, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import dialIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/dialIcon.png';
import { FormattedMessage, useIntl } from 'react-intl';
import './TwoOneOneFooterNC.css';
import { useLocalizedLink } from '../../Config/configHook';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { telHref } from '../../Referrer/footerPhone';

const TwoOneOneFooterNC = () => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const { getReferrer } = useContext(Context);
  const footerPhone = getReferrer('footerPhone', '');

  const twoOneOneDialALProps = {
    id: 'twoOneOneFooter.dialAL',
    defaultMsg: '211 dial link',
  };
  const twoOneOneTOSALProps = {
    id: 'twoOneOneFooter.termsOfSvcAL',
    defaultMsg: '211 terms of service',
  };

  const displayDialStack = () => {
    return (
      <Stack direction="row" gap="1rem">
        <img src={dialIcon} className="twoOneOneNC-footer-icon" alt="talk to a 2-1-1 navigator via phone" />
        <Box>
          <Typography className="icon-header">
            <FormattedMessage id="footer-dial-text-nc" defaultMessage="Dial" />
          </Typography>
          <Link
            href="tel:211"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneDialALProps)}
            color="primary"
            sx={{ display: 'inline-block' }}
          >
            <FormattedMessage id="footer-dial-text-nc" defaultMessage="Dial " />
            2-1-1
          </Link>
          {footerPhone && (
            <>
              &nbsp;
              <Typography className="font-color" sx={{ display: 'inline-block' }}>
                <FormattedMessage id="footer-or-text-nc" defaultMessage=" or" />
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
                <FormattedMessage id="footer-tollFree-text-nc" defaultMessage="toll free" />
              </Typography>
            </>
          )}
        </Box>
      </Stack>
    );
  };

  const displayFirstParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-first-paragraph-nc"
          defaultMessage="Services found within search results may involve eligibility criteria. 
          Please contact the resource directly to find out more information about how to obtain these services. 
          This site contains links to other sites. All of the information provided is believed to be accurate and reliable. 
          However, NC 211 assumes no responsibility for any errors appearing, nor for the use of the information provided."
        />
      </Typography>
    );
  };

  const displaySecondParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-second-paragraph-nc-phone"
          defaultMessage="NC 211 is an information and referral service provided by United Way of North Carolina and powered by local United Ways of North Carolina. Families and individuals can call 2-1-1 or {phone} to receive free and confidential information on health and human services within their community. Offered in multiple languages and available 24 hours a day, 7 days a week, and 365 days a year."
          values={{ phone: footerPhone }}
        />
      </Typography>
    );
  };

  const displayCopyrightPolicySection = () => {
    return (
      <Box className="twoOneOne-font flexIntoRow copyright-container">
        <Typography className="privacy-policy-links">
          <FormattedMessage id="footer-copyright-nc" defaultMessage="© Copyright 2-1-1 North Carolina" />
        </Typography>
        <Box className="flexLinksIntoRow">
          <Link
            href="http://prod211nc.wpengine.com/wp-content/uploads/2020/06/PRIVACY-POLICY.pdf"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(twoOneOneTOSALProps)}
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-twoOneOne-privacy-nc" defaultMessage="2-1-1 Privacy Policy |" />
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
            id="footer-header-nc"
            defaultMessage="Not finding what you are looking for? Try calling 211 for help:"
          />
        </Box>
        <Box className="flexIntoRow icon-section">{displayDialStack()}</Box>
      </Paper>
      <Box className="flexIntoRow footer-paragraph first-paragraph">{displayFirstParagraph()}</Box>
      <Box className="flexIntoRow footer-paragraph second-paragraph">{displaySecondParagraph()}</Box>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef', padding: '1rem 1rem' }} square={true}>
        {displayCopyrightPolicySection()}
      </Paper>
    </footer>
  );
};

export default TwoOneOneFooterNC;
