import { useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { AppBar, IconButton, Dialog } from '@mui/material';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Context } from '../../Wrapper/Wrapper';
import LanguageSelect from '../../LanguageSelect/LanguageSelect';
import CclaLogo from '../../../Assets/States/NC/WhiteLabels/CclaAssets/ccla_mfb_logo_v2.png';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import './CclaHeader.css';
import CclaShare from '../CclaShare/CclaShare';
import { useQueryString } from '../../QuestionComponents/questionHooks';

const CclaHeader = () => {
  const { whiteLabel } = useContext(Context);
  const queryString = useQueryString();
  const intl = useIntl();

  const selectLangAriaLabelProps = {
    id: 'header.selectLang-AL',
    defaultMessage: 'select a language',
  };
  const shareButtonAriaLabelProps = {
    id: 'header.shareBtn-AL',
    defaultMessage: 'share button',
  };
  const shareMFBModalAriaLabelProps = {
    id: 'header.shareMFBModal-AL',
    defaultMessage: 'share my friend ben modal',
  };
  const logoAltText = {
    id: 'cclaHeader.logo.alt',
    defaultMessage: 'Charlotte Center for Legal Advocacy and MyFriendBen logo',
  };

  const [openShare, setOpenShare] = useState(false);

  const handleOpenShare = () => {
    setOpenShare(true);
  };

  const handleCloseShare = () => {
    setOpenShare(false);
  };

  return (
    <nav>
      <Paper elevation={4} square={true} className="ccla-header-container">
        <AppBar position="sticky" id="ccla-nav-container" elevation={0}>
          <Box>
            <a href={`/${whiteLabel}/step-1${queryString}`}>
              <img src={CclaLogo} alt={intl.formatMessage(logoAltText)} className="ccla-cobranded-logo" />
            </a>
          </Box>
          <Stack direction="row" gap=".55rem">
            <Stack direction="row" gap=".25rem" alignItems="center">
              <LanguageIcon className="ccla-globe-icon" />
              <LanguageSelect
                id="ccla-select-language"
                ariaLabel={intl.formatMessage(selectLangAriaLabelProps)}
                iconColor="#000000"
                menuItemColor="#000000"
              />
              <IconButton
                onClick={handleOpenShare}
                aria-label={intl.formatMessage(shareButtonAriaLabelProps)}
                sx={{ padding: '0', color: '#000000' }}
              >
                <ShareIcon role="img" />
              </IconButton>
            </Stack>
            <Dialog
              open={openShare}
              onClose={handleCloseShare}
              aria-label={intl.formatMessage(shareMFBModalAriaLabelProps)}
              sx={{ '& .MuiPaper-root': { borderRadius: '1rem' } }}
            >
              <CclaShare close={handleCloseShare} />
            </Dialog>
          </Stack>
        </AppBar>
      </Paper>
    </nav>
  );
};

export default CclaHeader;
