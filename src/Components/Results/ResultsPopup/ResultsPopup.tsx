import { Alert, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormattedMessage } from 'react-intl';
import { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { ITheme } from '../../../Assets/styleController';
import './ResultsPopup.css';

type ColorTheme = 'blue' | 'orange';

/**
 * Props for the ResultsPopup component
 */
type ResultsPopupProps = {
  /**
   * Condition function that determines whether to show the popup
   * @returns true to show the popup, false to hide it
   * @note For optimal performance with delaySeconds > 0, wrap this function in useCallback
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
   * Optional delay in seconds before showing the popup
   * @default 0 (shows immediately)
   */
  delaySeconds?: number;
};

type PopupColors = {
  bg: string;
  border: string;
  icon: string;
};

/**
 * Gets colors for the popup based on color theme
 */
const getPopupColors = (colorTheme: ColorTheme, theme: ITheme): PopupColors => {
  const colorMap: Record<ColorTheme, PopupColors> = {
    blue: {
      bg: theme.secondaryBackgroundColor,
      border: theme.primaryColor,
      icon: theme.primaryColor,
    },
    orange: {
      bg: 'white',
      border: theme.secondaryColor,
      icon: theme.secondaryColor,
    },
  };

  return colorMap[colorTheme];
};

/**
 * Gets button color based on color theme
 */
const getButtonColor = (colorTheme: ColorTheme, theme: ITheme): string => {
  return colorTheme === 'blue' ? theme.primaryColor : theme.secondaryColor;
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
 * />
 */
const ResultsPopup = ({
  shouldShow,
  message,
  linkUrl,
  linkText = <FormattedMessage id="resultsPopup.learnMore" defaultMessage="Learn More" />,
  minimizedText = <FormattedMessage id="resultsPopup.minimized" defaultMessage="Click to learn more" />,
  colorTheme = 'orange',
  delaySeconds = 0,
}: ResultsPopupProps) => {
  const { theme } = useContext(Context);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDelayComplete, setIsDelayComplete] = useState(delaySeconds === 0);

  // Handle delay before showing popup
  useEffect(() => {
    if (delaySeconds > 0 && shouldShow()) {
      const timer = setTimeout(() => {
        setIsDelayComplete(true);
      }, delaySeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [delaySeconds, shouldShow]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const colors = useMemo(() => getPopupColors(colorTheme, theme), [colorTheme, theme]);
  const buttonColor = useMemo(() => getButtonColor(colorTheme, theme), [colorTheme, theme]);

  // Don't render if condition not met or delay not complete
  if (!shouldShow() || !isDelayComplete) {
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
          sx={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            cursor: 'pointer',
            margin: 0,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
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
      <div className="results-popup-container" role="dialog" aria-label="Survey invitation">
        <Alert
          severity="info"
          icon={false}
          sx={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
          }}
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
              sx={{
                backgroundColor: buttonColor,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'white !important',
                  color: buttonColor,
                  borderColor: buttonColor,
                },
              }}
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
