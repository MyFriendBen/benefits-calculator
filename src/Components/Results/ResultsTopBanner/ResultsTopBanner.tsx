import { Alert, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormattedMessage } from 'react-intl';
import { useState, useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import './ResultsTopBanner.css';

type ResultsTopBannerProps = {
  /**
   * Condition function that determines whether to show the banner
   * Return true to show, false to hide
   */
  shouldShow: () => boolean;
  /**
   * The message to display in the banner
   */
  message: React.ReactNode;
  /**
   * Optional link URL - if provided, shows a button
   */
  linkUrl?: string;
  /**
   * Optional link text - defaults to "Learn More"
   */
  linkText?: React.ReactNode;
  /**
   * Optional severity level for the Alert component
   * Defaults to "info"
   */
  severity?: 'error' | 'warning' | 'info' | 'success';
};

/**
 * ResultsTopBanner component displays a dismissible banner at the top of the results page
 * that is sticky/locked to the top of the screen when scrolling.
 *
 * Example usage:
 * <ResultsTopBanner
 *   shouldShow={() => someCondition === true}
 *   message={<FormattedMessage id="banner.message" defaultMessage="Important message here" />}
 *   linkUrl="https://example.com"
 *   linkText={<FormattedMessage id="banner.linkText" defaultMessage="Click here" />}
 *   severity="warning"
 * />
 */
const ResultsTopBanner = ({
  shouldShow,
  message,
  linkUrl,
  linkText = <FormattedMessage id="resultsTopBanner.learnMore" defaultMessage="Learn More" />,
  severity = 'info',
}: ResultsTopBannerProps) => {
  const { theme } = useContext(Context);
  const [isMinimized, setIsMinimized] = useState(false);

  // Don't render if condition not met
  if (!shouldShow()) {
    return null;
  }

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  // Helper function to lighten a color (for backgrounds)
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  // Define colors based on severity using theme colors
  const severityColors = {
    info: {
      bg: theme.secondaryBackgroundColor, // Light background
      border: theme.primaryColor, // Primary color border
      icon: theme.primaryColor,
    },
    warning: {
      bg: theme.cssVariables['--warning-background-color'] || lightenColor(theme.secondaryColor, 80),
      border: theme.secondaryColor, // Secondary/terra cotta
      icon: theme.secondaryColor,
    },
    error: {
      bg: lightenColor(theme.cssVariables['--icon-color'] || '#D6743F', 85),
      border: theme.cssVariables['--icon-color'] || '#D6743F', // Icon color (red/orange)
      icon: theme.cssVariables['--icon-color'] || '#D6743F',
    },
    success: {
      bg: lightenColor(theme.midBlueColor, 85),
      border: theme.midBlueColor, // Mid blue
      icon: theme.midBlueColor,
    },
  };

  const colors = severityColors[severity];

  // Button color logic: blue for info, orange for warning/error/success
  const buttonColor = severity === 'info' ? theme.primaryColor : theme.secondaryColor;

  // Minimized state - small box in bottom-right corner
  if (isMinimized) {
    return (
      <div className="results-top-banner-minimized" onClick={handleRestore}>
        <Alert
          severity={severity}
          icon={false}
          sx={{
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            cursor: 'pointer',
            margin: 0,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
            <FormattedMessage id="resultsTopBanner.minimized" defaultMessage="Help Us Improve - Get $10" />
          </Typography>
        </Alert>
      </div>
    );
  }

  // Full popup state - centered on screen
  return (
    <div className="results-top-banner-container">
      <Alert
        severity={severity}
        icon={false}
        sx={{
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleMinimize}
            className="results-top-banner-close-button"
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <Typography variant="body1" className="results-top-banner-text">
          {message}
        </Typography>

        {linkUrl && (
          <Button
            component="a"
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            className="results-top-banner-button"
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
  );
};

export default ResultsTopBanner;
