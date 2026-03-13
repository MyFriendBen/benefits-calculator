import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { MenuItem } from '@mui/material';
import { SxProps, Theme } from '@mui/material';
import { IncomeStreamFormData } from './types';

export const useMonthMenuItems = () => {
  const intl = useIntl();
  return useMemo(() => {
    const months: Record<number, string> = {
      1: intl.formatMessage({ id: 'ageInput.months.january', defaultMessage: 'January' }),
      2: intl.formatMessage({ id: 'ageInput.months.february', defaultMessage: 'February' }),
      3: intl.formatMessage({ id: 'ageInput.months.march', defaultMessage: 'March' }),
      4: intl.formatMessage({ id: 'ageInput.months.april', defaultMessage: 'April' }),
      5: intl.formatMessage({ id: 'ageInput.months.may', defaultMessage: 'May' }),
      6: intl.formatMessage({ id: 'ageInput.months.june', defaultMessage: 'June' }),
      7: intl.formatMessage({ id: 'ageInput.months.july', defaultMessage: 'July' }),
      8: intl.formatMessage({ id: 'ageInput.months.august', defaultMessage: 'August' }),
      9: intl.formatMessage({ id: 'ageInput.months.september', defaultMessage: 'September' }),
      10: intl.formatMessage({ id: 'ageInput.months.october', defaultMessage: 'October' }),
      11: intl.formatMessage({ id: 'ageInput.months.november', defaultMessage: 'November' }),
      12: intl.formatMessage({ id: 'ageInput.months.december', defaultMessage: 'December' }),
    };
    return Object.entries(months).map(([key, label]) => (
      <MenuItem value={Number(key)} key={key}>{label}</MenuItem>
    ));
  }, [intl]);
};

// BASIC_INFO_GRID_STYLES requires responsive breakpoints, so must be SxProps
export const BASIC_INFO_GRID_STYLES: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
  gap: '1rem',
  marginTop: '1rem',
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

// Error section mapping for scroll-to-error functionality (main workflow)
export const ERROR_SECTION_MAP = [
  { key: 'birthMonth', id: 'basic-info-section' },
  { key: 'birthYear', id: 'basic-info-section' },
  { key: 'relationshipToHH', id: 'basic-info-section' },
  { key: 'healthInsurance', id: 'health-insurance-section' },
  { key: 'conditions', id: 'conditions-section' },
  { key: 'studentEligibility', id: 'student-eligibility-section' },
  { key: 'incomeStreams', id: 'income-stream' },
] as const;

// Error section mapping for EC workflow (no health insurance or student eligibility)
export const ENERGY_CALCULATOR_ERROR_SECTION_MAP = [
  { key: 'birthMonth', id: 'basic-info-section' },
  { key: 'birthYear', id: 'basic-info-section' },
  { key: 'relationshipToHH', id: 'basic-info-section' },
  { key: 'conditions', id: 'conditions-section' },
  { key: 'receivesSsi', id: 'conditions-section' },
  { key: 'incomeStreams', id: 'income-stream' },
] as const;
