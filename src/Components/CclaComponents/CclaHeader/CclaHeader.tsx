import { useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { AppBar, MenuItem, Select, IconButton, Dialog, SelectChangeEvent } from '@mui/material';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useConfig } from '../../Config/configHook';
import { Context } from '../../Wrapper/Wrapper';
import CclaLogo from '../../../Assets/States/NC/WhiteLabels/CclaAssets/ccla_mfb_logo_v2.png';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import './CclaHeader.css';
import CclaShare from '../CclaShare/CclaShare';
import { useQueryString } from '../../QuestionComponents/questionHooks';

type LanguageOptions = {
  [key: string]: string;
};

const CclaHeader = () => {
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
  const shareMFBModalAriaLabelProps = {
    id: 'header.shareMFBModal-AL',
    defaultMessage: 'share my friend ben modal',
  };
  const logoAltText = {
    id: 'cclaHeader.logo.alt',
    defaultMessage: 'Charlotte Center for Legal Advocacy and MyFriendBen logo',
  };

  const [openShare, setOpenShare] = useState(false);
  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = useState(false);

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
              <Select
                labelId="select-language-label"
                id="ccla-select-language"
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
              <CclaShare close={handleCloseShare} />
            </Dialog>
          </Stack>
        </AppBar>
      </Paper>
    </nav>
  );
};

export default CclaHeader;
