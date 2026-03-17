import { Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useState, useCallback } from 'react';
import PopupMinimized from './shared/PopupMinimized';
import PopupModal from './shared/PopupModal';
import './ResultsPopup.css';

// Default messages to avoid creating new elements on every render
const DEFAULT_LINK_TEXT = <FormattedMessage id="resultsPopup.button" defaultMessage="Learn More" />;
const DEFAULT_MINIMIZED_TEXT = <FormattedMessage id="resultsPopup.minimized" defaultMessage="Click to learn more" />;

/**
 * Props for the ResultsPopup component
 */
type ResultsPopupProps = {
  /**
   * Condition function that determines whether to show the popup
   * @returns true to show the popup, false to hide it
   */
  shouldShow: () => boolean;
  /**
   * The message to display in the popup
   * Can be a string, JSX element, or FormattedMessage component
   */
  message: React.ReactNode;
  /**
   * Optional link URL - if provided, shows a clickable button
   * Opens in a new tab with noopener noreferrer for security
   */
  linkUrl?: string;
  /**
   * Optional link text for the button
   * @default "Learn More" (internationalized)
   */
  linkText?: React.ReactNode;
  /**
   * Optional text to display when popup is minimized
   * @default "Click to learn more" (internationalized)
   */
  minimizedText?: React.ReactNode;
  /**
   * Optional boolean to start the popup in minimized state
   * @default false
   */
  startMinimized?: boolean;
};

/**
 * ResultsPopup component displays a dismissible popup that can be minimized.
 * When minimized, it shows as a small box in the bottom-right corner.
 */
const ResultsPopup = ({
  shouldShow,
  message,
  linkUrl,
  linkText = DEFAULT_LINK_TEXT,
  minimizedText = DEFAULT_MINIMIZED_TEXT,
  startMinimized = false,
}: ResultsPopupProps) => {
  const [isMinimized, setIsMinimized] = useState(startMinimized);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleMinimize = useCallback(() => setIsMinimized(true), []);
  const handleRestore = useCallback(() => setIsMinimized(false), []);
  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent restore from triggering
    setIsDismissed(true);
  }, []);

  // Don't render if condition not met or completely dismissed
  if (!shouldShow() || isDismissed) return null;

  // Minimized state - small box in bottom-right corner
  if (isMinimized) {
    return (
      <PopupMinimized
        label={minimizedText}
        onRestore={handleRestore}
        onDismiss={handleDismiss}
        ariaLabel="Restore survey popup"
        className="results-popup-minimized"
        closeButtonClassName="results-popup-minimized-close-button"
      />
    );
  }

  // Full popup state - centered on screen
  return (
    <PopupModal
      onClose={handleMinimize}
      ariaLabel="Survey invitation"
      containerClassName="results-popup-container"
      backdropClassName="results-popup-backdrop"
      closeButtonClassName="results-popup-close-button"
    >
      <Typography variant="body1" className="results-popup-text">
        {message}
      </Typography>
      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener"
          className="results-popup-button"
          onClick={handleMinimize}
        >
          {linkText}
        </a>
      )}
    </PopupModal>
  );
};

export default ResultsPopup;
