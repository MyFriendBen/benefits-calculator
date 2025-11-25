import { SxProps, Theme } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { IncomeStreamFormData } from './types';

// BASIC_INFO_GRID_STYLES requires responsive breakpoints, so must be SxProps
export const BASIC_INFO_GRID_STYLES: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
  gap: '1rem',
  marginTop: '1rem',
};

// Month labels for birth month selection
export const MONTHS: Record<number, JSX.Element> = {
  1: <FormattedMessage id="ageInput.months.january" defaultMessage="January" />,
  2: <FormattedMessage id="ageInput.months.february" defaultMessage="February" />,
  3: <FormattedMessage id="ageInput.months.march" defaultMessage="March" />,
  4: <FormattedMessage id="ageInput.months.april" defaultMessage="April" />,
  5: <FormattedMessage id="ageInput.months.may" defaultMessage="May" />,
  6: <FormattedMessage id="ageInput.months.june" defaultMessage="June" />,
  7: <FormattedMessage id="ageInput.months.july" defaultMessage="July" />,
  8: <FormattedMessage id="ageInput.months.august" defaultMessage="August" />,
  9: <FormattedMessage id="ageInput.months.september" defaultMessage="September" />,
  10: <FormattedMessage id="ageInput.months.october" defaultMessage="October" />,
  11: <FormattedMessage id="ageInput.months.november" defaultMessage="November" />,
  12: <FormattedMessage id="ageInput.months.december" defaultMessage="December" />,
};

// Frequency order from least to most frequent (business logic, not styling)
export const FREQUENCY_ORDER = ['once', 'yearly', 'monthly', 'semimonthly', 'biweekly', 'weekly', 'hourly'];

// Empty income stream template
export const EMPTY_INCOME_STREAM: IncomeStreamFormData = {
  incomeCategory: '',
  incomeStreamName: '',
  incomeAmount: '',
  incomeFrequency: '',
  hoursPerWeek: '',
};

// Error section mapping for scroll-to-error functionality
export const ERROR_SECTION_MAP = [
  { key: 'birthMonth', id: 'basic-info-section' },
  { key: 'birthYear', id: 'basic-info-section' },
  { key: 'relationshipToHH', id: 'basic-info-section' },
  { key: 'healthInsurance', id: 'health-insurance-section' },
  { key: 'specialConditions', id: 'conditions-section' },
  { key: 'hasIncome', id: 'income-section' },
  { key: 'incomeStreams', id: 'income-section' },
] as const;
