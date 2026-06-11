import { useContext, useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AppBar, MenuItem, Select, Link, IconButton, Dialog, SelectChangeEvent } from '@mui/material';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useConfig } from '../../Config/configHook';
import { Context } from '../../Wrapper/Wrapper';
import LancLogo from '../../../Assets/States/NC/WhiteLabels/LancAssets/lanc_mfb_logo.png';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './LancHeader.css';
import LancShareNC from '../LancShare/LancShare';
import { useQueryString } from '../../QuestionComponents/questionHooks';

type LanguageOptions = {
  [key: string]: string;
};

const LancHeader = () => {
  const { locale, selectLanguage, whiteLabel } = useContext(Context);
  const languageOptions = useConfig<LanguageOptions>('language_options');
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
    id: 'header.openMenuBtn-AL',
    defaultMessage: 'open menu',
  };
  const closeBtnAriaLabelProps = {
    id: 'header.closeMenuBtn-AL',
    defaultMessage: 'close menu',
  };
  const shareMFBModalAriaLabelProps = {
    id: 'header.shareMFBModal-AL',
    defaultMessage: 'share my friend ben modal',
  };
  const logoAltText = {
    id: 'lancHeader.logo.alt',
    defaultMessage: 'LANC and myfriendben logo',
  };

  const [openShare, setOpenShare] = useState(false);
  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = useState(false);
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

  const handleCloseLanguage = () => {
    setIsLanguageSelectOpen(false);
  };

  const handleOpenLanguage = () => {
    setIsLanguageSelectOpen(true);
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    selectLanguage(event.target.value);
  };

  const createMenuItems = (optionList: LanguageOptions) => {
    const menuItemKeyLabelPairArr = Object.entries(optionList);

    const dropdownMenuItems = menuItemKeyLabelPairArr.map((key) => {
      return (
        <MenuItem value={key[0]} key={key[0]} sx={{ color: '#000000' }}>
          {key[1]}
        </MenuItem>
      );
    });

    return dropdownMenuItems;
  };

  return (
    <nav>
      <Paper elevation={4} square={true} className="lanc-header-container">
        <AppBar position="sticky" id="lanc-nav-container" elevation={0}>
          <Box>
            <a href={`/${whiteLabel}/step-1${queryString}`}>
              <img src={LancLogo} alt={intl.formatMessage(logoAltText)} className="cobranded-logo" />
            </a>
          </Box>
          <Stack direction="row" gap=".55rem">
            <Stack direction="row" gap=".25rem" alignItems="center">
              <LanguageIcon className="lanc-globe-icon" />
              <Select
                labelId="select-language-label"
                id="lanc-select-language"
                value={locale}
                label="Language"
                onChange={handleLanguageChange}
                aria-label={intl.formatMessage(selectLangAriaLabelProps)}
                variant="standard"
                disableUnderline={true}
                open={isLanguageSelectOpen}
                onOpen={handleOpenLanguage}
                onClose={handleCloseLanguage}
                sx={{ '& .MuiSvgIcon-root': { color: '#000000' } }}
              >
                {createMenuItems(languageOptions)}
              </Select>
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
              <LancShareNC close={handleCloseShare} />
            </Dialog>
          </Stack>
        </AppBar>
      </Paper>
    </nav>
  );
};

export default LancHeader;
