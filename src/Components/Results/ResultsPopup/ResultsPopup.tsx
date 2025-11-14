import { Alert, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormattedMessage } from 'react-intl';
import { useState, useCallback } from 'react';
import './ResultsPopup.css';

type ColorTheme = 'blue' | 'orange';

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
   * Optional color theme for styling the popup
   * - blue: Uses primary theme colors
   * - orange: Uses orange/error theme colors (default)
   * @default "orange"
   */
  colorTheme?: ColorTheme;
  /**
   * Optional initial display state of the popup
   * - 'popup': Show as full popup initially (default)
   * - 'minimized': Start in minimized state
   * @default "popup"
   */
  initialState?: 'popup' | 'minimized';
};

/**
 * ResultsPopup component displays a dismissible popup that can be minimized.
 * When minimized, it shows as a small box in the bottom-right corner.
 *
 * @example
 * <ResultsPopup
 *   shouldShow={() => someCondition === true}
 *   message={<FormattedMessage id="popup.message" defaultMessage="Important message" />}
 *   linkUrl="https://example.com"
 *   linkText={<FormattedMessage id="popup.linkText" defaultMessage="Click here" />}
 *   colorTheme="blue"
 *   initialState="minimized"
 * />
 */
const ResultsPopup = ({
  shouldShow,
  message,
  linkUrl,
  linkText = <FormattedMessage id="resultsPopup.learnMore" defaultMessage="Learn More" />,
  minimizedText = <FormattedMessage id="resultsPopup.minimized" defaultMessage="Click to learn more" />,
  colorTheme = 'orange',
  initialState = 'popup',
}: ResultsPopupProps) => {
  const [isMinimized, setIsMinimized] = useState(initialState === 'minimized');
  const [isDismissed, setIsDismissed] = useState(false);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent restore from triggering
    setIsDismissed(true);
  }, []);

  // Don't render if condition not met or completely dismissed
  if (!shouldShow() || isDismissed) {
    return null;
  }

  // Minimized state - small box in bottom-right corner
  if (isMinimized) {
    return (
      <div
        className={`results-popup-minimized ${colorTheme === 'blue' ? 'theme-blue' : 'theme-orange'}`}
        onClick={handleRestore}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRestore();
          }
        }}
        aria-label="Restore survey popup"
      >
        <Alert
          severity="info"
          icon={false}
          action={
            <IconButton
              aria-label="Close popup"
              color="inherit"
              size="small"
              onClick={handleDismiss}
              className="results-popup-minimized-close-button"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="body2">
            {minimizedText}
          </Typography>
        </Alert>
      </div>
    );
  }

  // Full popup state - centered on screen
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="results-popup-backdrop"
        onClick={handleMinimize}
        aria-hidden="true"
      />

      {/* Popup content */}
      <div
        className={`results-popup-container ${colorTheme === 'blue' ? 'theme-blue' : 'theme-orange'}`}
        role="dialog"
        aria-label="Survey invitation"
      >
        <Alert
          severity="info"
          icon={false}
          action={
            <IconButton
              aria-label="Minimize popup"
              color="inherit"
              size="small"
              onClick={handleMinimize}
              className="results-popup-close-button"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="body1" className="results-popup-text">
            {message}
          </Typography>

          {linkUrl && (
            <Button
              component="a"
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              className="results-popup-button"
              onClick={handleMinimize}
            >
              {linkText}
            </Button>
          )}
        </Alert>
      </div>
    </>
  );
};

export default ResultsPopup;
