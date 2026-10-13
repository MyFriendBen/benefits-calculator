import { ClickAwayListener, IconButton } from '@mui/material';
import { PropsWithChildren, useState } from 'react';
import { useIntl } from 'react-intl';
import { ReactComponent as HelpBubble } from '../../Assets/icons/helpBubble.svg';
import { useTrackEvent } from '../../Assets/analytics';
import './HelpButton.css';

// `helpTopic` (e.g. "income-frequency") is the slice dimension for
// screener_help_click — the confusion metric is grouped by topic. Passed by
// every site so no tooltip logs as 'unknown'.
// `stepName` is the analytics step slug of the page hosting the tooltip; the
// host step passes it (the leaf can't resolve it). Omit where no step applies.
type HelpButtonProps = PropsWithChildren<{ className?: string; helpTopic?: string; stepName?: string }>;

const HelpButton = ({ className, children, helpTopic, stepName }: HelpButtonProps) => {
  const intl = useIntl();
  const track = useTrackEvent();
  const [showHelpText, setShowHelpText] = useState(false);
  const handleClick = () => {
    // Fire on open only (the confusion signal), not close. Single chokepoint, so
    // no inline "?" tooltip goes untracked.
    if (!showHelpText) {
      track('screener_help_click', { help_topic: helpTopic ?? 'unknown', screener_step_name: stepName });
    }
    setShowHelpText((setShow) => !setShow);
  };
  const translatedAriaLabel = intl.formatMessage({ id: 'helpButton.ariaText', defaultMessage: 'help button' });

  // ClickAwayListener closes the bubble on outside click. Its child MUST be a real
  // element (not a Fragment) — MUI attaches a ref and no-ops if it's null. `span`
  // keeps it inline within the flex label row.
  return (
    <ClickAwayListener onClickAway={() => setShowHelpText(false)}>
      <span className="help-button-wrapper">
        <IconButton onClick={handleClick} aria-label={translatedAriaLabel}>
          <HelpBubble style={{ height: '18px', width: '18px' }} className="help-button-icon-color" />
        </IconButton>
        {showHelpText && <p className={`help-text ${className ?? ''}`.trim()}>{children}</p>}
      </span>
    </ClickAwayListener>
  );
};

export default HelpButton;
