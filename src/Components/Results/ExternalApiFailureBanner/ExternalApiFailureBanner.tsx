import { Alert, Stack, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useResultsContext } from '../Results';

/**
 * ExternalApiFailureBanner warns the user that some results may be incomplete when an
 * external dependency (e.g. PolicyEngine) failed while the backend computed results.
 * The backend reports which services failed via `external_api_failures`; for now we
 * show a single generic message whenever that list is non-empty (the ids remain
 * available in context for future per-service copy).
 */
const ExternalApiFailureBanner = () => {
  const { externalApiFailures } = useResultsContext();

  if (externalApiFailures.length === 0) {
    return null;
  }

  return (
    <Stack
      sx={{
        width: '100%',
        px: '1rem',
        marginTop: '2rem',
      }}
      spacing={2}
    >
      <Alert
        severity="warning"
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontFamily: '"Open Sans", sans-serif',
            lineHeight: 1.5,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          <FormattedMessage
            id="results.externalApiFailure.message"
            defaultMessage="Some results may be temporarily unavailable due to a technical issue. Please check back later."
          />
        </Typography>
      </Alert>
    </Stack>
  );
};

export default ExternalApiFailureBanner;
