import { useState } from 'react';
import { useIntl } from 'react-intl';
import { renderLogoSource } from '../../Referrer/referrerDataInfo';
import './Banner.css';

const CesnBanner = () => {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);

  const doraLogo = renderLogoSource(
    'CESN_Colorado_White',
    intl.formatMessage({
      id: 'cesnHeader.logo.alt',
      defaultMessage: 'Colorado Department of Regulatory Agencies logo',
    }),
    'cesn-header-logo',
  );

  return (
    <div className="cesn-official-banner">
      <div className="cesn-official-banner-inner">
        {doraLogo}
        <span className="cesn-official-banner-text">An official website of the State of Colorado</span>
        <button className="cesn-banner-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          Here&apos;s how you know <span className="cesn-banner-toggle-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <button className="cesn-banner-close-mobile" onClick={() => setIsOpen(false)} aria-label="Close">
            ✕
          </button>
        )}
      </div>
      {isOpen && (
        <div className="cesn-banner-dropdown">
          <div className="cesn-banner-dropdown-inner">
            <div className="cesn-banner-dropdown-item">
              <span className="cesn-banner-dropdown-icon" aria-hidden="true">🏛</span>
              <div>
                <p className="cesn-banner-dropdown-title">Official websites use .gov</p>
                <p className="cesn-banner-dropdown-body">
                  A <strong>.gov</strong> website belongs to an official government organization in the United States.
                </p>
              </div>
            </div>
            <div className="cesn-banner-dropdown-item">
              <span className="cesn-banner-dropdown-icon" aria-hidden="true">🔒</span>
              <div>
                <p className="cesn-banner-dropdown-title">Secure .gov websites use HTTPS</p>
                <p className="cesn-banner-dropdown-body">
                  A <strong>lock (🔒)</strong> or <strong>https://</strong> means you&apos;ve safely connected to the
                  .gov website. Share sensitive information only on official, secure websites.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CesnBanner;
