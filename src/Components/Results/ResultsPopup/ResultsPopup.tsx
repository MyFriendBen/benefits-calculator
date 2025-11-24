import { Alert, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormattedMessage } from 'react-intl';
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const dialogRef = useRef<HTMLDivElement>(null);

  const [isMinimized, setIsMinimized] = useState(startMinimized);
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

  // Focus management for accessibility
  useEffect(() => {
    if (!isMinimized && !isDismissed && shouldShow()) {
      // Focus the dialog when it opens
      dialogRef.current?.focus();
    }
  }, [isMinimized, isDismissed, shouldShow]);

  // Don't render if condition not met or completely dismissed
  if (!shouldShow() || isDismissed) {
    return null;
  }

  // Minimized state - small box in bottom-right corner
  if (isMinimized) {
    return (
      <div
        className="results-popup-minimized"
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
        ref={dialogRef}
        className="results-popup-container"
        role="dialog"
        aria-modal="true"
        aria-label="Survey invitation"
        tabIndex={-1}
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
