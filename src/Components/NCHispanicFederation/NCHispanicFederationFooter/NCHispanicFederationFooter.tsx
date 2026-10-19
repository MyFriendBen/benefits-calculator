import { Paper, Stack, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import dialIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/dialIcon.png';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocalizedLink } from '../../Config/configHook';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { telHref } from '../../Referrer/footerPhone';
import './NCHispanicFederationFooter.css';

const NCHispanicFederationFooter = () => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');
  const { getReferrer } = useContext(Context);
  const footerPhone = getReferrer('footerPhone', '');

  const hfedDialALProps = {
    id: 'hfedFooter.dialAL',
    defaultMsg: 'Hispanic Federation dial link',
  };
  const hfedApplyALProps = {
    id: 'hfedFooter.referralAL',
    defaultMessage: 'Referal link',
  };
  const hfedTOSALProps = {
    id: 'hfedFooter.termsOfSvcAL',
    defaultMsg: 'Hispanic Federation terms of service',
  };

  const displayDialStack = () => {
    return (
      <Stack direction="row" gap="2rem">
        <img
          src={dialIcon}
          className="hfed-footer-icon"
          alt="talk to a HFED navigator via phone or get referral online"
        />
        <Box sx={{ textAlign: 'center' }}>
          {footerPhone && (
            <>
              <Typography>
                <FormattedMessage id="footer-dial-text-hfed" defaultMessage="Call the Helpline at " />
              </Typography>
              <Link
                href={telHref(footerPhone)}
                underline="none"
                target="_blank"
                aria-label={intl.formatMessage(hfedDialALProps)}
                color="primary"
              >
                {footerPhone}
              </Link>
              <Typography>
                <FormattedMessage id="footer-or-text-nc" defaultMessage=" or" />
                &nbsp;
              </Typography>
            </>
          )}
          <Typography>
            <FormattedMessage id="footer-apply-text-hfed" defaultMessage="Fill out the " />
          </Typography>
          <Link
            href="https://forms.office.com/r/TzwDbk2ixY"
            underline="none"
            target="_blank"
            aria-label={intl.formatMessage(hfedApplyALProps)}
            color="primary"
          >
            Salud NC referral form
          </Link>
        </Box>
      </Stack>
    );
  };

  const displayFirstParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-first-paragraph-nc-hfed"
          defaultMessage="Services found within search results may involve eligibility criteria. Please contact the resource directly to find out more information about how to obtain these services. This site contains links to other sites. All of the information provided is believed to be accurate and reliable. However, Salud NC and the Hispanic Federation assume no responsibility for any errors appearing, nor for the use of the information provided."
        />
      </Typography>
    );
  };

  const displaySecondParagraph = () => {
    return (
      <Typography>
        <FormattedMessage
          id="footer-second-paragraph-nc-hfed-phone"
          defaultMessage="Salud NC is a project of the Hispanic Federation, a nonprofit organization dedicated to the well-being of the Latino community. The free and confidential Salud NC Health Line connects individuals and families in North Carolina with assistance in Spanish and English for a wide range of health-related needs. Support is available for navigating Medicaid and Marketplace insurance, locating free or low-cost clinics, accessing prescription assistance, and finding community resources such as food banks or legal aid for health issues. Call {phone} to get connected."
          values={{ phone: footerPhone }}
        />
      </Typography>
    );
  };

  const displayCopyrightPolicySection = () => {
    return (
      <Box className="hfed-font flexIntoRow copyright-container">
        <Typography className="privacy-policy-links">
          <FormattedMessage id="footer-copyright-nc-hfed" defaultMessage="© Copyright Hispanic Federation" />
        </Typography>
        <Link
          href={privacyPolicyLink}
          underline="none"
          target="_blank"
          aria-label={intl.formatMessage(hfedTOSALProps)}
          className="privacy-policy-links"
        >
          <FormattedMessage id="footer-hfed-mfb" defaultMessage="MyFriendBen Privacy Policy" />
        </Link>
      </Box>
    );
  };

  return (
    <footer>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef' }} className="paper-container" square={true}>
        <Box className="hfed-font flexIntoRow getHelp-text">
          <FormattedMessage
            id="footer-header-nc-hfed"
            defaultMessage="Not finding what you are looking for? Try these other ways to get help:"
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

export default NCHispanicFederationFooter;
