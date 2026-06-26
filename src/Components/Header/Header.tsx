import { AppBar, MenuItem, Select } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { Context } from '../Wrapper/Wrapper';
import LanguageIcon from '@mui/icons-material/Language';
import { useConfig } from '../Config/configHook';
import Paper from '@mui/material/Paper';
import { useIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import './Header.css';
import { useLogo } from '../Referrer/useLogo';
import { DEFAULT_WHITE_LABEL } from '../Wrapper/Wrapper';
import { useQueryString } from '../QuestionComponents/questionHooks';

const Header = () => {
  const context = useContext(Context);
  const { formData, getReferrer, whiteLabel } = context;
  const languageOptions = useConfig<{ [key: string]: string }>('language_options');
  const queryString = useQueryString();
  const landingPageQueryString = useQueryString({ path: null });
  const intl = useIntl();
  const logoClass = getReferrer('logoClass', 'logo');
  const stateName = getReferrer('stateName', '');

  const homeUrl = useMemo(() => {
    if (whiteLabel === undefined || whiteLabel === DEFAULT_WHITE_LABEL) {
      return `/step-1${queryString}`;
    }

    if (getReferrer('uiOptions').includes('logo_landing_page_link')) {
      return `/${whiteLabel}/landing-page${landingPageQueryString}`;
    }

    return `/${whiteLabel}/step-1${queryString}`;
  }, [whiteLabel]);

  const selectLangAriaLabelProps = {
    id: 'header.selectLang-AL',
    defaultMessage: 'select a language',
  };

  const [isLanguageSelectOpen, setIsLanguageSelectOpen] = useState(false);

  const handleCloseLanguage = () => {
    setIsLanguageSelectOpen(false);
  };

  const handleOpenLanguage = () => {
    setIsLanguageSelectOpen(true);
  };

  const createMenuItems = (optionList: { [key: string]: string }) => {
    const menuItemKeyLabelPairArr = Object.entries(optionList);

    const dropdownMenuItems = menuItemKeyLabelPairArr.map((key) => {
      return (
        <MenuItem value={key[0]} key={key[0]}>
          {key[1]}
        </MenuItem>
      );
    });

    return dropdownMenuItems;
  };

  const containerClass = useMemo(() => {
    let className = 'header-full-width-container';

    if (formData.frozen) {
      className += ' frozen';
    }

    if (getReferrer('uiOptions').includes('white_header')) {
      className += ' white-header';
    }

    if (getReferrer('uiOptions').includes('small_header_language_dropdown')) {
      className += ' small-header-language-dropdown';
    }

    return className;
  }, [formData.frozen]);

  return (
    <nav>
      <Paper className={containerClass} square={true} elevation={0}>
        <AppBar id="nav-container" position="sticky" elevation={0}>
          <a href={homeUrl} className="home-link">
            <div className="logo-container">
              {useLogo('logoSource', 'logoAlt', logoClass)}
              {stateName && <div className="state-name">{stateName}</div>}
            </div>
          </a>
          <div className="icon-wrapper">
            <LanguageIcon />
            <Select
              labelId="select-language-label"
              id="select-language"
              placeholder="Change Language"
              value={context.locale}
              label="Language"
              onChange={(event) => context.selectLanguage(event.target.value)}
              aria-label={intl.formatMessage(selectLangAriaLabelProps)}
              variant="standard"
              disableUnderline={true}
              open={isLanguageSelectOpen}
              onOpen={handleOpenLanguage}
              onClose={handleCloseLanguage}
              sx={{ '& .MuiSvgIcon-root': { color: '#FFFFFF' } }}
            >
              {createMenuItems(languageOptions)}
            </Select>
          </div>
        </AppBar>
        {formData.frozen && (
          <div className="header-frozen-message-container">
            <FormattedMessage
              id="header.frozen.message"
              defaultMessage="This screen is frozen. Changes you make will not be saved."
            />
          </div>
        )}
      </Paper>
    </nav>
  );
};

export default Header;
