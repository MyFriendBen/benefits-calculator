import { Icon } from '../Icon/Icon';
import './WarningMessage.css';
import ResultsTranslate from '../Results/Translate/Translate';
import { WarningMsg } from '../../Types/Results';
import { useIntl } from 'react-intl';

type WarningMessageProps = {
  warning: WarningMsg;
};

const WarningMessage = ({ warning }: WarningMessageProps) => {
  const intl = useIntl();

  let translatedLink = '';
  if (warning.link_url.default_message !== '') {
    translatedLink = intl.formatMessage({
      id: warning.link_url.label,
      defaultMessage: warning.link_url.default_message,
    });
  }

  return (
    <div className="warning-message">
      <Icon name="triangle-alert" className="warning-icon" />
      <p>
        <ResultsTranslate translation={warning.message} />
        {translatedLink !== '' && (
          <span className="warning-message-link">
            <a href={translatedLink} target="_blank" className="link-color">
              <ResultsTranslate translation={warning.link_text} />
            </a>
          </span>
        )}
      </p>
    </div>
  );
};

export default WarningMessage;
