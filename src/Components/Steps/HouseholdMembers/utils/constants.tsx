import { SxProps, Theme } from '@mui/material';
import { IncomeStreamFormData } from './types';

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
  { key: 'hasIncome', id: 'income-section' },
  { key: 'incomeStreams', id: 'income-stream' },
] as const;

// Error section mapping for EC workflow (no health insurance or student eligibility)
export const ENERGY_CALCULATOR_ERROR_SECTION_MAP = [
  { key: 'birthMonth', id: 'basic-info-section' },
  { key: 'birthYear', id: 'basic-info-section' },
  { key: 'relationshipToHH', id: 'basic-info-section' },
  { key: 'conditions', id: 'conditions-section' },
  { key: 'receivesSsi', id: 'conditions-section' },
  { key: 'hasIncome', id: 'income-section' },
  { key: 'incomeStreams', id: 'income-stream' },
] as const;
