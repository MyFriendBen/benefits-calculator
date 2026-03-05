import { IconButton } from '@mui/material';
import { PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { ReactComponent as HelpBubble } from '../../Assets/icons/General/helpBubble.svg';
import { Context } from '../Wrapper/Wrapper';
import './HelpButton.css';

type HelpButtonProps = PropsWithChildren<{ className?: string }>;

const HelpButton = ({ className, children }: HelpButtonProps) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();
  const [showHelpText, setShowHelpText] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const handleClick = () => {
    setShowHelpText((setShow) => !setShow);
  };
  const translatedAriaLabel = intl.formatMessage({ id: 'helpButton.ariaText', defaultMessage: 'help button' });
  const alwaysOpen = getReferrer('uiOptions').includes('help_bubble_always_open');
  const isOpen = showHelpText || alwaysOpen;

  // Only registers a listener while the help text is open — skipped entirely when alwaysOpen
  // is true (the button is hidden, so showHelpText never becomes true).
  useEffect(() => {
    if (!showHelpText) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowHelpText(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHelpText]);

  return (
    // display:contents makes the span invisible to layout so it doesn't affect flex/grid spacing.
    // The span has no role, no text, and no interactive behaviour of its own, so screen readers
    // treat it as a transparent grouping element — no accessibility impact.
    // The ref is used only for click-outside detection via contains(), which works regardless
    // of display:contents.
    <span ref={ref} style={{ display: 'contents' }}>
      {!alwaysOpen && (
        <IconButton onClick={handleClick} aria-label={translatedAriaLabel}>
          <HelpBubble style={{ height: '20px', width: '20px' }} className="help-button-icon-color" />
        </IconButton>
      )}
      {isOpen && <p className={`help-text ${className}`}>{children}</p>}
    </span>
  );
};

export default HelpButton;
