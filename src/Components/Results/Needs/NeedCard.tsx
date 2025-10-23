import { FormattedMessage, useIntl } from 'react-intl';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UrgentNeed } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { formatPhoneNumber, generateNeedId, ICON_OPTIONS_MAP } from '../helpers';
import './NeedCard.css';

type NeedsCardProps = {
  need: UrgentNeed;
};

const getIcon = (messageType: string) => {
  const Icon = ICON_OPTIONS_MAP[messageType] ?? ICON_OPTIONS_MAP['default']


  if (Icon !== undefined) {
    return <Icon />;
  }

  return null;
};

const NeedCard = ({ need }: NeedsCardProps) => {
  const intl = useIntl();
  const location = useLocation();
  const [infoIsOpen, setInfoIsOpen] = useState(false);

  // Check if this need should be expanded based on URL hash
  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const targetNeedId = generateNeedId(need.name.default_message);
      if (hash === `#${targetNeedId}`) {
        setInfoIsOpen(true);
        // Scroll to this element after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(targetNeedId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [location.hash, need.name.default_message]);

  let translatedLink = '';
  if (need.link.default_message !== '') {
    translatedLink = intl.formatMessage({ id: need.link.label, defaultMessage: need.link.default_message });
  }

  const needType = need.icon.toLowerCase();
  const icon = getIcon(needType);
  const translatedNeedDesc = intl.formatMessage({
    id: need.description.label,
    defaultMessage: need.description.default_message,
  });

  const needId = generateNeedId(need.name.default_message);

  return (
    <div id={needId} className="need-card-container">
      <div className="header-and-button-divider">
        <div className="result-resource-more-info">
          {icon}
          <span>
            <ResultsTranslate translation={need.category_type} />
            <strong>
              <ResultsTranslate translation={need.name} />
            </strong>
          </span>
        </div>
        <button
          className={infoIsOpen ? 'more-info-btn-open' : 'more-info-btn'}
          onClick={() => {
            setInfoIsOpen(!infoIsOpen);
          }}
        >
          <FormattedMessage id="more-info" defaultMessage="More Info" />
        </button>
      </div>
      {infoIsOpen && (
        <>
          <p className="need-desc-paragraph">{translatedNeedDesc}</p>
          {need.phone_number && (
            <a href={`tel:${need.phone_number}`} className="phone-number">
              {formatPhoneNumber(need.phone_number)}
            </a>
          )}
          {translatedLink !== '' && (
            <div className="visit-website-btn-container">
              <a href={translatedLink} target="_blank" className="visit-website-btn">
                <FormattedMessage id="visit-website-btn" defaultMessage="Visit Website" />
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NeedCard;
