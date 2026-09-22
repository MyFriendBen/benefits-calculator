import { AppBar } from '@mui/material';
import { useContext, useMemo } from 'react';
import { Context } from '../Wrapper/Wrapper';
import LanguageIcon from '@mui/icons-material/Language';
import LanguageSelect from '../LanguageSelect/LanguageSelect';
import Paper from '@mui/material/Paper';
import { useIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import './Header.css';
import { useLogo } from '../Referrer/useLogo';
import { DEFAULT_WHITE_LABEL } from '../Wrapper/Wrapper';
import { useQueryString } from '../QuestionComponents/questionHooks';
import { useTrackEvent } from '../../Assets/analytics';

const Header = () => {
  const context = useContext(Context);
  const { formData, getReferrer, whiteLabel } = context;
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

  const track = useTrackEvent();

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
          <a href={homeUrl} className="home-link" onClick={() => track('screener_logo_click', { location: 'header' })}>
            <div className="logo-container">
              {useLogo('logoSource', 'logoAlt', logoClass)}
              {stateName && <div className="state-name">{stateName}</div>}
            </div>
          </a>
          <div className="icon-wrapper">
            <LanguageIcon />
            <LanguageSelect
              id="select-language"
              onChange={(languageCode, languageLabel) => {
                track('screener_language_changed', { language_name: languageLabel });
                context.selectLanguage(languageCode);
              }}
              ariaLabel={intl.formatMessage(selectLangAriaLabelProps)}
              iconColor="#FFFFFF"
            />
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
