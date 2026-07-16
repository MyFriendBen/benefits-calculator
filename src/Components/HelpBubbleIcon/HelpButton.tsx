import { ClickAwayListener, IconButton } from '@mui/material';
import { PropsWithChildren, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { ReactComponent as HelpBubble } from '../../Assets/icons/helpBubble.svg';
import { Context } from '../Wrapper/Wrapper';
import './HelpButton.css';

// `helpTopic` identifies which tooltip this is, so a step's different tooltips
// stay distinguishable. It is not used yet — the analytics instrumentation that
// consumes it lands in a separate follow-up PR (kept out of this behavior-
// preserving refactor). Callers should pass it now so the instrumentation PR is
// a pure addition.
type HelpButtonProps = PropsWithChildren<{ className?: string; helpTopic?: string }>;

const HelpButton = ({ className, children }: HelpButtonProps) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();
  const [showHelpText, setShowHelpText] = useState(false);
  const handleClick = () => {
    setShowHelpText((setShow) => !setShow);
  };
  const translatedAriaLabel = intl.formatMessage({ id: 'helpButton.ariaText', defaultMessage: 'help button' });
  const alwaysOpen = getReferrer('uiOptions').includes('help_bubble_always_open');
  const isOpen = showHelpText || alwaysOpen;

  // Close the bubble when the user clicks outside it (unless it's forced open via
  // the help_bubble_always_open referrer option). Consolidated here so every
  // tooltip site gets the same click-away behavior the inlined income-frequency
  // tooltip previously had.
  return (
    <ClickAwayListener onClickAway={() => setShowHelpText(false)}>
      <>
        {!alwaysOpen && (
          <IconButton onClick={handleClick} aria-label={translatedAriaLabel}>
            <HelpBubble style={{ height: '20px', width: '20px' }} className="help-button-icon-color" />
          </IconButton>
        )}
        {isOpen && <p className={`help-text ${className}`}>{children}</p>}
      </>
    </ClickAwayListener>
  );
};

export default HelpButton;
