import { AppBar, Dialog, IconButton, MenuItem, Select } from '@mui/material';
import Paper from '@mui/material/Paper';
import { useContext, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import LanguageIcon from '@mui/icons-material/Language';
import IosShareIcon from '@mui/icons-material/IosShare';
import CloseIcon from '@mui/icons-material/Close';
import { Context } from '../../Wrapper/Wrapper';
import { useConfig } from '../../Config/configHook';
import { useQueryString } from '../../QuestionComponents/questionHooks';
import { renderLogoSource } from '../../Referrer/referrerDataInfo';
import Share from '../../Share/Share';
import './Header.css';

const CesnHeader = () => {
  const { locale, selectLanguage, whiteLabel, formData } = useContext(Context);
  const languageOptions = useConfig<{ [key: string]: string }>('language_options');
  const queryString = useQueryString({ path: null });
  const intl = useIntl();
  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = useState(false);
  const [openShare, setOpenShare] = useState(false);

  const homeUrl = `/${whiteLabel}/landing-page${queryString}`;

  const doraLogo = renderLogoSource(
    'CESN_DORA_Color',
    intl.formatMessage({
      id: 'cesnHeader.logo.alt',
      defaultMessage: 'Colorado Department of Regulatory Agencies logo',
    }),
    'cesn-header-logo',
  );

  const containerClass = useMemo(() => {
    let className = 'cesn-header-container';
    if (formData.frozen) {
      className += ' frozen';
    }
    return className;
  }, [formData.frozen]);

  return (
    <nav>
      <Paper className={containerClass} square={true} elevation={1}>
        <AppBar id="cesn-nav-container" position="sticky" elevation={0}>
          <a href={homeUrl} className="cesn-home-link">
            {doraLogo}
          </a>
          <div className="cesn-header-right">
            <LanguageIcon className="cesn-globe-icon" />
            <Select
              labelId="cesn-select-language-label"
              id="cesn-select-language"
              value={locale}
              label="Language"
              onChange={(event) => selectLanguage(event.target.value)}
              aria-label={intl.formatMessage({ id: 'header.selectLang-AL', defaultMessage: 'select a language' })}
              variant="standard"
              disableUnderline={true}
              open={isLanguageSelectOpen}
              onOpen={() => setIsLanguageSelectOpen(true)}
              onClose={() => setIsLanguageSelectOpen(false)}
              sx={{ '& .MuiSvgIcon-root': { color: '#000000' } }}
            >
              {Object.entries(languageOptions).map(([key, label]) => (
                <MenuItem value={key} key={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            <IconButton
              onClick={() => setOpenShare(true)}
              aria-label={intl.formatMessage({ id: 'header.shareBtn-AL', defaultMessage: 'share button' })}
              className="cesn-share-button"
            >
              <IosShareIcon />
              <span className="cesn-share-button-text">
                <FormattedMessage id="cesnHeader.share" defaultMessage="Share" />
              </span>
            </IconButton>
          </div>
        </AppBar>
        {formData.frozen && (
          <div className="cesn-header-frozen-message">
            <FormattedMessage
              id="header.frozen.message"
              defaultMessage="This screen is frozen. Changes you make will not be saved."
            />
          </div>
        )}
      </Paper>
      <Dialog
        open={openShare}
        onClose={() => setOpenShare(false)}
        aria-label={intl.formatMessage({ id: 'header.shareMFBModal-AL', defaultMessage: 'share my friend ben modal' })}
        sx={{ '& .MuiPaper-root': { borderRadius: '1rem', backgroundColor: 'var(--primary-color)' } }}
      >
        <IconButton
          onClick={() => setOpenShare(false)}
          aria-label={intl.formatMessage({ id: 'share.closeAL', defaultMessage: 'close' })}
          sx={{ alignSelf: 'flex-end', color: '#ffffff', margin: '0.5rem 0.5rem 0 0' }}
        >
          <CloseIcon />
        </IconButton>
        <Share />
      </Dialog>
    </nav>
  );
};

export default CesnHeader;
