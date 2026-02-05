import { IconButton } from '@mui/material';
import { PropsWithChildren, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { ReactComponent as HelpBubble } from '../../Assets/icons/General/helpBubble.svg';
import { Context } from '../Wrapper/Wrapper';
import './HelpButton.css';

type HelpButtonProps = PropsWithChildren<{ className?: string }>;

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

  return (
    <>
      {!alwaysOpen && (
        <IconButton onClick={handleClick} aria-label={translatedAriaLabel}>
          <HelpBubble style={{ height: '20px', width: '20px' }} className="help-button-icon-color" />
        </IconButton>
      )}
      {isOpen && <p className={`help-text ${className}`}>{children}</p>}
    </>
  );
};

export default HelpButton;
