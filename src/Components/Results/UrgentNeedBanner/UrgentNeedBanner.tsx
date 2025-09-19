import { Alert, Button, Stack, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import { useResultsContext, useResultsLink } from '../Results';
import { UrgentNeed } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { generateNeedId } from '../helpers';

/**
 * UrgentNeedBanner component displays notification banners for urgent needs
 * that have notification messages configured
 */
const UrgentNeedBanner = () => {
  const { needs } = useResultsContext();
  const { theme } = useContext(Context);
  const needsPageLink = useResultsLink('results/near-term-needs');
  
  // Filter urgent needs that have notification messages
  const urgentNeedsWithNotifications = needs.filter(need => {
    if (!need.notification_message) return false;
    const message = need.notification_message.default_message;
    return message && message.trim();
  });
  
  if (urgentNeedsWithNotifications.length === 0) {
    return null;
  }
  
  return (
    <Stack sx={{ 
      width: '100%', 
      px: '1rem',
      marginTop: '2rem'
    }} spacing={2}>
      {urgentNeedsWithNotifications.map((need: UrgentNeed, index: number) => (
        <Alert 
          key={index}
          severity="info" 
          sx={{ 
            backgroundColor: theme.secondaryBackgroundColor,
            border: `2px solid ${theme.primaryColor}`,
            '& .MuiAlert-icon': {
              color: theme.primaryColor
            },
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        > 
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2,
              fontFamily: '"Open Sans", sans-serif',
              lineHeight: 1.5
            }}
          >
            <ResultsTranslate translation={need.notification_message!} />
          </Typography>
          
          <Button 
            component={NavLink}
            to={`${needsPageLink}#${generateNeedId(need.name.default_message)}`}
            variant="contained" 
            sx={{ 
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              fontSize: '0.8rem',
              px: { xs: 1.5, md: 2 }, // 0.5rem 0.75rem on mobile, 0.5rem 1rem on desktop
              py: 1, // 0.5rem
              borderRadius: '0.75rem',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'none'
              }
            }}
          >
            <FormattedMessage 
              id="urgentNeedBanner.learnMore" 
              defaultMessage="Learn More" 
            />
          </Button>
        </Alert>
      ))}
    </Stack>
  );
};

export default UrgentNeedBanner;
