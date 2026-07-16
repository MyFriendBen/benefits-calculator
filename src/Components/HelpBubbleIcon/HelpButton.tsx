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
  // Defensive: getReferrer is absent if this shared component is rendered outside
  // the Wrapper Context (e.g. a unit test of a host component that doesn't mount
  // the full provider tree). Fall back to "not forced open" rather than crashing.
  const alwaysOpen = getReferrer?.('uiOptions')?.includes('help_bubble_always_open') ?? false;
  const isOpen = showHelpText || alwaysOpen;

  // Close the bubble when the user clicks outside it (unless it's forced open via
  // the help_bubble_always_open referrer option). Consolidated here so every
  // tooltip site gets the same click-away behavior the inlined income-frequency
  // tooltip previously had.
  //
  // MUST wrap the children in a real element (not a Fragment): MUI's
  // ClickAwayListener attaches a ref to its single child and no-ops if that ref
  // is null — a Fragment can't hold a ref, so onClickAway would silently never
  // fire. A `span` keeps this inline (the icon sits inside a flex label row).
  return (
    <ClickAwayListener onClickAway={() => setShowHelpText(false)}>
      <span className="help-button-wrapper">
        {!alwaysOpen && (
          <IconButton onClick={handleClick} aria-label={translatedAriaLabel}>
            <HelpBubble style={{ height: '18px', width: '18px' }} className="help-button-icon-color" />
          </IconButton>
        )}
        {isOpen && <p className={`help-text ${className ?? ''}`.trim()}>{children}</p>}
      </span>
    </ClickAwayListener>
  );
};

export default HelpButton;
