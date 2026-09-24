import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useResultsLink } from '../Results';
import { useTrackEvent } from '../../../Assets/analytics';
import './211Button.css';

// Results-page CTA to the Immediate Help resources — NOT the inline "?" tooltip
// (that is HelpButton in HelpBubbleIcon/). CESN renders no tab bar, so this is its
// only entry point to that page.
const MoreHelpButton = () => {
  const track = useTrackEvent();
  const moreHelpLink = useResultsLink(`results/more-help`);

  return (
    <div className="help-text-for-211-button">
      <h2 className="text-center help-text-for-211-button-font">
        <FormattedMessage id="moreHelp.211-header" defaultMessage="Can't find what you need?" />
      </h2>
      <Link
        to={moreHelpLink}
        className="button211"
        onClick={() => track('screener_get_help_click', { location: 'results' })}
      >
        {/* Shares the Immediate Help tab's translation ID so both routes to this page
            carry one label. */}
        <FormattedMessage id="resultsOptions.immediateHelp" defaultMessage="Immediate Help" />
      </Link>
    </div>
  );
};

export default MoreHelpButton;
