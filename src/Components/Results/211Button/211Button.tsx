import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useResultsLink } from '../Results';
import './211Button.css';

// Results-page "More Help / 211" CTA — NOT the inline "?" tooltip (that is
// HelpButton in HelpBubbleIcon/).
const MoreHelpButton = () => {
  const intl = useIntl();
  const moreHelpALProps = {
    id: 'helpButton.AL',
    defaultMessage: 'more help button',
  };

  const moreHelpLink = useResultsLink(`results/more-help`);

  return (
    <div className="help-text-for-211-button">
      <h2 className="text-center help-text-for-211-button-font">
        <FormattedMessage id="moreHelp.211-header" defaultMessage="Can't find what you need?" />
      </h2>
      <Link to={moreHelpLink} className="button211" aria-label={intl.formatMessage(moreHelpALProps)}>
        <FormattedMessage id="moreHelp.211-link" defaultMessage="More Help" />
      </Link>
    </div>
  );
};

export default MoreHelpButton;
