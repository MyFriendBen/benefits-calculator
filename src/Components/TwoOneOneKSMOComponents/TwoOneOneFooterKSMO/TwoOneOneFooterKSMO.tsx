import { Paper, Stack, Typography, Link } from '@mui/material';
import Box from '@mui/material/Box';
import dialIcon from '../../../Assets/States/CO/WhiteLabels/TwoOneOneAssets/dialIcon.png';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
// Shares the layout classes of the 2-1-1 North Carolina footer it is modeled on.
import '../../TwoOneOneNCComponents/TwoOneOneFooterNC/TwoOneOneFooterNC.css';
import './TwoOneOneFooterKSMO.css';
import { useLocalizedLink } from '../../Config/configHook';

type StateCopy = { about: MessageDescriptor; disclaimer: MessageDescriptor };

const ksCopy = defineMessages({
  about: {
    id: 'footer-about-paragraph-ks',
    defaultMessage:
      '2-1-1 Kansas is a collaboration between United Way of the Plains and United Way of Greater Kansas City. 2-1-1 Kansas is committed to helping Kansas residents connect with the services they need. Whether by phone or internet, our goal is to present accurate, well-organized and easy-to-find information from state and local health and human services programs. No matter where you live in Kansas, you can dial 2-1-1 and find information about resources in your local community. Whether you need help finding food or housing, childcare, crisis counseling or substance abuse treatment, one number is all you need to know.',
  },
  disclaimer: {
    id: 'footer-disclaimer-paragraph-ks',
    defaultMessage:
      'Services found within search results may involve eligibility criteria. Please contact the resource directly to find out more information about how to obtain these services. This site contains links to other sites. All of the information provided is believed to be accurate and reliable. However, 2-1-1 Kansas assumes no responsibility for any errors appearing, nor for the use of the information provided.',
  },
});

const moCopy = defineMessages({
  about: {
    id: 'footer-about-paragraph-mo',
    defaultMessage:
      '2-1-1 Missouri is a collaboration between United Way of Greater St. Louis and United Way of Greater Kansas City. 2-1-1 Missouri is committed to helping Missouri residents connect with the services they need. Whether by phone or internet, our goal is to present accurate, well-organized and easy-to-find information from state and local health and human services programs. No matter where you live in Missouri, you can dial 2-1-1 and find information about resources in your local community. Whether you need help finding food or housing, childcare, crisis counseling or substance abuse treatment, one number is all you need to know.',
  },
  disclaimer: {
    id: 'footer-disclaimer-paragraph-mo',
    defaultMessage:
      'Services found within search results may involve eligibility criteria. Please contact the resource directly to find out more information about how to obtain these services. This site contains links to other sites. All of the information provided is believed to be accurate and reliable. However, 2-1-1 Missouri assumes no responsibility for any errors appearing, nor for the use of the information provided.',
  },
});

const TwoOneOneFooterKSMO = ({ copy }: { copy: StateCopy }) => {
  const intl = useIntl();
  const privacyPolicyLink = useLocalizedLink('privacy_policy');

  // The grey bar reuses the 2-1-1 Colorado footer's labels, which are already translated.
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
          <Stack direction="row" gap="1rem">
            <img src={dialIcon} className="twoOneOneNC-footer-icon" alt="" />
            <Box>
              <Typography className="icon-header">
                <FormattedMessage id="footer-dial-text" defaultMessage="Dial" />
              </Typography>
              <Link
                href="tel:211"
                underline="none"
                aria-label={intl.formatMessage({ id: 'twoOneOneFooter.dialAL', defaultMessage: '211 dial link' })}
                color="primary"
              >
                <FormattedMessage id="footer-dial-text" defaultMessage="Dial " />
                2-1-1
              </Link>
            </Box>
          </Stack>
        </Box>
      </Paper>
      <Box className="flexIntoRow footer-paragraph twoOneOneKSMO-about">
        <Typography>
          <FormattedMessage {...copy.about} />
        </Typography>
      </Box>
      <Box className="flexIntoRow footer-paragraph twoOneOneKSMO-disclaimer">
        <Typography>
          <FormattedMessage {...copy.disclaimer} />
        </Typography>
      </Box>
      <Paper elevation={0} sx={{ width: '100%', backgroundColor: '#efefef', padding: '1rem 1rem' }} square={true}>
        <Box className="twoOneOne-font flexIntoRow copyright-container">
          <Link
            href={privacyPolicyLink}
            underline="none"
            target="_blank"
            rel="noreferrer"
            className="privacy-policy-links"
          >
            <FormattedMessage id="footer-twoOneOne-mfb" defaultMessage="MyFriendBen Privacy Policy" />
          </Link>
        </Box>
      </Paper>
    </footer>
  );
};

export const TwoOneOneFooterKS = () => <TwoOneOneFooterKSMO copy={ksCopy} />;

export const TwoOneOneFooterMO = () => <TwoOneOneFooterKSMO copy={moCopy} />;
