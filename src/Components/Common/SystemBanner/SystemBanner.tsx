import { Alert, Stack, Typography, Collapse, Button } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useContext, useState, useMemo } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { parseMarkdown } from '../../../utils/parseMarkdown';
import React from 'react';

export type BannerMessage = {
  id: string;
  title: string | React.ReactNode;
  content: string | React.ReactNode;
  enabled: boolean;
  priority: number;
};

type BannerState = {
  [bannerId: string]: boolean; // true = expanded, false = collapsed
};

type SystemBannerProps = {
  banners: BannerMessage[];
};

/**
 * SystemBanner component displays configurable system-wide notification banners
 * Supports multiple banners with collapsible content
 */
const SystemBanner = ({ banners }: SystemBannerProps) => {
  const { theme, config } = useContext(Context);
  const intl = useIntl();

  // Helper to extract string value from FormattedMessage or plain string
  const getTextValue = (value: string | React.ReactNode): string => {
    if (typeof value === 'string') {
      return value;
    }
    // If it's a FormattedMessage component created by config transformation
    if (React.isValidElement(value) && value.props?.id && value.props?.defaultMessage) {
      return intl.formatMessage({
        id: value.props.id,
        defaultMessage: value.props.defaultMessage,
      });
    }
    // Fallback to string conversion
    return String(value);
  };

  // Initialize banner states - all banners start collapsed
  const [expandedStates, setExpandedStates] = useState<BannerState>(() => {
    const initialState: BannerState = {};
    banners.forEach((banner) => {
      initialState[banner.id] = false;
    });
    return initialState;
  });

  // Filter to only enabled banners and sort by priority
  const enabledBanners = useMemo(
    () => banners.filter((b) => b.enabled).sort((a, b) => a.priority - b.priority),
    [banners],
  );

  if (enabledBanners.length === 0) {
    return null;
  }

  const toggleBanner = (bannerId: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [bannerId]: !prev[bannerId],
    }));
  };

  return (
    <Stack
      sx={{
        width: '100%',
        px: '1rem',
        marginTop: '2rem',
      }}
      spacing={2}
    >
      {enabledBanners.map((banner: BannerMessage) => {
        const isExpanded = expandedStates[banner.id];
        const titleText = getTextValue(banner.title);
        const contentText = getTextValue(banner.content);
        const processedContent = parseMarkdown(contentText, theme.primaryColor);

        return (
          <Alert
            key={banner.id}
            severity="info"
            sx={{
              backgroundColor: theme.secondaryBackgroundColor,
              border: `2px solid ${theme.primaryColor}`,
              '& .MuiAlert-icon': {
                color: theme.primaryColor,
              },
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: isExpanded ? 2 : 0 }}>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                {titleText}
              </Typography>

              <Button
                onClick={() => toggleBanner(banner.id)}
                variant="text"
                color="primary"
                sx={{
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  minWidth: 'auto',
                  padding: 0,
                }}
                aria-expanded={isExpanded}
                aria-controls={`system-banner-content-${banner.id}`}
              >
                {isExpanded ? (
                  <FormattedMessage id="systemBanner.less" defaultMessage="Less" />
                ) : (
                  <FormattedMessage id="systemBanner.more" defaultMessage="More" />
                )}
              </Button>
            </Stack>

            <Collapse in={isExpanded} id={`system-banner-content-${banner.id}`}>
              <Typography
                variant="body1"
                component="div"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  lineHeight: 1.5,
                }}
              >
                {Array.isArray(processedContent) 
                  ? processedContent.map((element, index) => 
                      React.isValidElement(element) ? element : <React.Fragment key={index}>{element}</React.Fragment>
                    )
                  : processedContent
                }                
              </Typography>
            </Collapse>
          </Alert>
        );
      })}
    </Stack>
  );
};

export default SystemBanner;
