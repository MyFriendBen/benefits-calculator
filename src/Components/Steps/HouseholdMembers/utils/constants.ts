import { SxProps, Theme } from '@mui/material';

// BASIC_INFO_GRID_STYLES requires responsive breakpoints, so must be SxProps
export const BASIC_INFO_GRID_STYLES: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
  gap: '1rem',
  marginTop: '1rem',
};

// Frequency order from least to most frequent (business logic, not styling)
export const FREQUENCY_ORDER = ['once', 'yearly', 'monthly', 'semimonthly', 'biweekly', 'weekly', 'hourly'];
