import { SxProps, Theme } from '@mui/material';

// Theme constants for household member forms
export const SECTION_STYLES: SxProps<Theme> = {
  margin: '0.75rem 0',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid',
  borderColor: 'divider',
};

export const INCOME_BOX_STYLES: SxProps<Theme> = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
  padding: '1rem',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
};

export const FORM_FIELD_LABEL_STYLES: SxProps<Theme> = {
  fontSize: '0.875rem',
  fontWeight: 600,
  marginBottom: '0.25rem',
};

export const WHITE_INPUT_STYLES: SxProps<Theme> = {
  backgroundColor: '#fff',
};

export const INCOME_BUTTON_STYLES: SxProps<Theme> = {
  padding: '0.75rem',
  borderRadius: '8px',
  textTransform: 'none',
  fontSize: '1rem',
};

export const BASIC_INFO_GRID_STYLES: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
  gap: '1rem',
  marginTop: '1rem',
};

// Frequency order from least to most frequent
export const FREQUENCY_ORDER = ['once', 'yearly', 'monthly', 'semimonthly', 'biweekly', 'weekly', 'hourly'];
