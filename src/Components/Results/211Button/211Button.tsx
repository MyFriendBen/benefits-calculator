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
        {/* Own translation ID, separate from the tab's `resultsOptions.immediateHelp`.
            Translation labels are globally unique with no white label dimension, so a
            shared ID cannot carry different copy for CESN than for the tab the other
            white labels render. */}
        <FormattedMessage id="energyCalculator.results.moreHelp" defaultMessage="More Help" />
      </Link>
    </div>
  );
};

export default MoreHelpButton;
