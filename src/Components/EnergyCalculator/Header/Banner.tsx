import { useIntl } from 'react-intl';
import { renderLogoSource } from '../../Referrer/referrerDataInfo';
import './Header.css';

const CesnBanner = () => {
  const intl = useIntl();

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
      </div>
    </div>
  );
};

export default CesnBanner;
