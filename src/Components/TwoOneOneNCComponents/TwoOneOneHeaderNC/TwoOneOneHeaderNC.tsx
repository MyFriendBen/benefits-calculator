import { useContext, useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AppBar, Link, IconButton, Dialog } from '@mui/material';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Context } from '../../Wrapper/Wrapper';
import LanguageSelect from '../../LanguageSelect/LanguageSelect';
import NCtwoOneOneMFBLogo from '../../../Assets/States/NC/WhiteLabels/TwoOneOneAssets/nc211-MFB-CTD-2025.png';
import twoOneOneNCLinks from '../../../Assets/States/NC/WhiteLabels/TwoOneOneAssets/twoOneOneNCLink';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './TwoOneOneHeaderNC.css';
import TwoOneOneShareNC from '../TwoOneOneShareNC/TwoOneOneShareNC';
import { useQueryString } from '../../QuestionComponents/questionHooks';

const TwoOneOneHeaderNC = () => {
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
  const openMenuBtnAriaLabelProps = {
    id: '211Header.openMenuBtn-AL',
    defaultMessage: 'open menu',
  };
  const closeBtnAriaLabelProps = {
    id: '211Header.closeMenuBtn-AL',
    defaultMessage: 'close menu',
  };
  const shareMFBModalAriaLabelProps = {
    id: 'header.shareMFBModal-AL',
    defaultMessage: 'share my friend ben modal',
  };
  const logoAltText = {
    id: '211Header.logo.alt',
    defaultMessage: '211 and myfriendben logo',
  };

  const [openShare, setOpenShare] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  //this will disable the scroll when the hamburgerMenu is open
  useEffect(() => {
    if (openMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'scroll';
    }
  }, [openMenu]);

  const handleOpenShare = () => {
    setOpenShare(true);
  };

  const handleCloseShare = () => {
    setOpenShare(false);
  };

  const handleOpenMenu = () => {
    setOpenMenu(!openMenu);
  };

  const create211Links = () => {
    const mappedLinks = twoOneOneNCLinks.map((link, index) => {
      return (
        <Link
          href={link.href}
          underline="none"
          target="_blank"
          aria-label={link.ariaLabel}
          className="twoOneOneMenuLink"
          key={link.defaultMsg + index}
        >
          <FormattedMessage id={link.formattedMsgId} defaultMessage={link.defaultMsg} />
        </Link>
      );
    });

    return mappedLinks;
  };

  const displayHamburgerMenuIcon = () => {
    return (
      <IconButton
        edge="end"
        color="primary"
        aria-label={
          openMenu ? intl.formatMessage(closeBtnAriaLabelProps) : intl.formatMessage(openMenuBtnAriaLabelProps)
        }
        onClick={handleOpenMenu}
        className="hamburger-icon"
      >
        {openMenu ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
    );
  };

  const displayHamburgerMenu = () => {
    return <Stack id="hamburger-drawer">{create211Links()}</Stack>;
  };

  return (
    <nav>
      <Paper elevation={4} square={true} className="twoOneOne-header-container">
        <AppBar position="sticky" id="twoOneOne-nav-container" elevation={0} sx={{ backgroundColor: '#FFFFFF' }}>
          <Box>
            <a href={`/${whiteLabel}/step-1${queryString}`}>
              <img src={NCtwoOneOneMFBLogo} alt={intl.formatMessage(logoAltText)} className="cobranded-logo" />
            </a>
          </Box>
          <Stack direction="row" gap=".55rem">
            <Stack direction="row" gap="0.55rem" alignItems="center" className="twoOneOne-desktop-links">
              {create211Links()}
            </Stack>
            <Stack direction="row" gap=".25rem" alignItems="center">
              <LanguageIcon className="twoOneOne-globe-icon" />
              <LanguageSelect
                id="twoOneOne-NC-select-language"
                ariaLabel={intl.formatMessage(selectLangAriaLabelProps)}
                iconColor="#21296B"
                menuItemColor="#21296B"
              />
              <IconButton
                color="primary"
                onClick={handleOpenShare}
                aria-label={intl.formatMessage(shareButtonAriaLabelProps)}
                sx={{ padding: '0' }}
              >
                <ShareIcon role="img" />
              </IconButton>
              {displayHamburgerMenuIcon()}
            </Stack>
            <Dialog
              open={openShare}
              onClose={handleCloseShare}
              aria-label={intl.formatMessage(shareMFBModalAriaLabelProps)}
              sx={{ '& .MuiPaper-root': { borderRadius: '1rem' } }}
            >
              <TwoOneOneShareNC close={handleCloseShare} />
            </Dialog>
          </Stack>
        </AppBar>
        {openMenu && displayHamburgerMenu()}
      </Paper>
    </nav>
  );
};

export default TwoOneOneHeaderNC;
