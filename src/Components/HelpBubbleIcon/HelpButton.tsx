import { ClickAwayListener, IconButton } from '@mui/material';
import { PropsWithChildren, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { ReactComponent as HelpBubble } from '../../Assets/icons/helpBubble.svg';
import { Context } from '../Wrapper/Wrapper';
import './HelpButton.css';

// `helpTopic` identifies which tooltip this is (unused here; consumed by the
// analytics instrumentation in the follow-up PR — passed now so that stays additive).
type HelpButtonProps = PropsWithChildren<{ className?: string; helpTopic?: string }>;

const HelpButton = ({ className, children }: HelpButtonProps) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();
  const [showHelpText, setShowHelpText] = useState(false);
  const handleClick = () => {
    setShowHelpText((setShow) => !setShow);
  };
  const translatedAriaLabel = intl.formatMessage({ id: 'helpButton.ariaText', defaultMessage: 'help button' });
  // Optional-chained: getReferrer is absent when rendered outside Wrapper Context
  // (e.g. host-component unit tests). Fall back to "not forced open".
  const alwaysOpen = getReferrer?.('uiOptions')?.includes('help_bubble_always_open') ?? false;
  const isOpen = showHelpText || alwaysOpen;

  // ClickAwayListener closes the bubble on outside click. Its child MUST be a real
  // element (not a Fragment) — MUI attaches a ref and no-ops if it's null. `span`
  // keeps it inline within the flex label row.
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
