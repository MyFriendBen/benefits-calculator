import { Alert, Stack, Typography, Collapse, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useContext, useState, useMemo } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { parseMarkdown } from '../../../utils/parseMarkdown';

export type BannerMessage = {
  id: string;
  title: string;
  content: string;
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
        const processedContent = parseMarkdown(banner.content, theme.primaryColor);

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
                {banner.title}
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
                {processedContent}
              </Typography>
            </Collapse>
          </Alert>
        );
      })}
    </Stack>
  );
};

export default SystemBanner;
