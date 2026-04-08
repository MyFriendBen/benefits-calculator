import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import { renderLogoSource } from '../../Referrer/referrerDataInfo';
import './Banner.css';

const CesnBanner = () => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const doraLogo = renderLogoSource(
    'CESN_Colorado_White',
    intl.formatMessage({
      id: 'cesnHeader.logo.alt',
      defaultMessage: 'State of Colorado logo',
    }),
    'cesn-header-logo',
  );

  return (
    <div className="cesn-official-banner">
      <div className="cesn-official-banner-inner">
        {doraLogo}
        <span className="cesn-official-banner-text">
          <FormattedMessage id="cesnHeader.bannerText" defaultMessage="An official website of the State of Colorado" />
          <button className="cesn-banner-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} {...(isOpen && { 'aria-controls': 'cesn-banner-dropdown' })}>
            <FormattedMessage id="cesnHeader.bannerToggle" defaultMessage="Here's how you know" /> {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
        </span>
      </div>
      {isOpen && (
        <div className="cesn-banner-dropdown" id="cesn-banner-dropdown">
          <div className="cesn-banner-dropdown-align">
            <div className="cesn-banner-dropdown-inner">
            <div className="cesn-banner-dropdown-item">
              <AccountBalanceOutlinedIcon className="cesn-banner-dropdown-icon" />
              <div>
                <p className="cesn-banner-dropdown-title">
                  <FormattedMessage id="cesnHeader.govTitle" defaultMessage="Official websites use .gov" />
                </p>
                <p className="cesn-banner-dropdown-body">
                  <FormattedMessage
                    id="cesnHeader.govBody"
                    defaultMessage="A <b>.gov</b> website belongs to an official government organization in the United States."
                    values={{ b: (chunks) => <strong>{chunks}</strong> }}
                  />
                </p>
              </div>
            </div>
            <div className="cesn-banner-dropdown-item">
              <LockIcon className="cesn-banner-dropdown-icon" />
              <div>
                <p className="cesn-banner-dropdown-title">
                  <FormattedMessage id="cesnHeader.httpsTitle" defaultMessage="Secure .gov websites use HTTPS" />
                </p>
                <p className="cesn-banner-dropdown-body">
                  <FormattedMessage
                    id="cesnHeader.httpsBody"
                    defaultMessage="A <b>lock (</b>{lock}<b>)</b> or <b>https://</b> means you've safely connected to the .gov website. Share sensitive information only on official, secure websites."
                    values={{
                      b: (chunks) => <strong>{chunks}</strong>,
                      lock: <LockIcon className="cesn-banner-inline-lock" />,
                    }}
                  />
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CesnBanner;
