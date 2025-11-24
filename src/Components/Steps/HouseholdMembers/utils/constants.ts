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

// Error section mapping for scroll-to-error functionality
export const ERROR_SECTION_MAP = [
  { key: 'birthMonth', id: 'basic-info-section' },
  { key: 'birthYear', id: 'basic-info-section' },
  { key: 'relationshipToHH', id: 'basic-info-section' },
  { key: 'healthInsurance', id: 'health-insurance-section' },
  { key: 'conditions', id: 'conditions-section' },
  { key: 'hasIncome', id: 'income-section' },
  { key: 'incomeStreams', id: 'income-section' },
] as const;
