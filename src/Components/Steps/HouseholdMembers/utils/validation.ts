import { IntlShape } from 'react-intl';

// ============================================================================
// VALIDATION REGEX PATTERNS
// ============================================================================

export const ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO = /^(?!0+$)\d+$/;
export const MAX_HOURS_PER_WEEK = 168;
export const INCOME_AMOUNT_REGEX = /^\d{0,7}(?:\d\.\d{0,2})?$/;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates that at least one option in an object of booleans is true
 */
export const hasAtLeastOneTrue = (options: Record<string, boolean>): boolean => {
  return Object.values(options).some((option) => option === true);
};

/**
 * Validates that if 'none' is selected, no other options are selected
 */
export const validateNoneExclusive = (options: Record<string, boolean>): boolean => {
  if (options.none) {
    return Object.entries(options)
      .filter(([key]) => key !== 'none')
      .every(([, value]) => value === false);
  }
  return true;
};

/**
 * Validates hourly income requires hours per week
 */
export const validateHourlyIncome = (incomeFrequency: string, hoursPerWeek: string): boolean => {
  if (incomeFrequency === 'hourly') {
    return ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test(hoursPerWeek) && Number(hoursPerWeek) <= MAX_HOURS_PER_WEEK;
  }
  return true;
};

/**
 * Validates income amount format and > 0
 */
export const validateIncomeAmount = (value: string): boolean => {
  return INCOME_AMOUNT_REGEX.test(value) && Number(value) > 0;
};

// ============================================================================
// INTERNATIONALIZED ERROR MESSAGES
// ============================================================================

export const renderMissingBirthMonthHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'ageInput.month.error',
    defaultMessage: 'Please enter a birth month.',
  });
};

export const renderFutureBirthMonthHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'hhmform.invalidBirthMonth',
    defaultMessage: 'This birth month is in the future.',
  });
};

export const renderBirthYearHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'ageInput.year.error',
    defaultMessage: 'Please enter a birth year.',
  });
};

export const renderInvalidBirthYearHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'ageInput.year.error.invalid',
    defaultMessage: 'Please enter a valid birth year.',
  });
};

export const renderHealthInsSelectOneHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'validation-helperText.selectOneHealthIns',
    defaultMessage: 'Please select at least one health insurance option.',
  });
};

export const renderHealthInsNonePlusHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'validation-helperText.nonePlusHealthIns',
    defaultMessage: 'Please do not select any other options if you do not have health insurance.',
  });
};

export const renderHealthInsNonePlusTheyHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'validation-helperText.hhMemberInsuranceNone-they',
    defaultMessage: 'Please do not select any other options if they do not have health insurance.',
  });
};

export const renderRelationshipToHHHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'errorMessage-HHMemberRelationship',
    defaultMessage: 'Please select a relationship.',
  });
};

export const renderIncomeStreamNameHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'errorMessage-incomeStreamName',
    defaultMessage: 'Please select an income source.',
  });
};

export const renderIncomeFrequencyHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'errorMessage-incomeFrequency',
    defaultMessage: 'Please select a frequency.',
  });
};

export const renderHoursWorkedHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage(
    {
      id: 'errorMessage-hoursPerWeek',
      defaultMessage: 'Please enter a number between 1 and {max}.',
    },
    { max: MAX_HOURS_PER_WEEK },
  );
};

export const renderIncomeAmountHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'errorMessage-greaterThanZero',
    defaultMessage: 'Please enter a number greater than 0.',
  });
};

export const renderIncomeCategoryHelperText = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'errorMessage-incomeCategory',
    defaultMessage: 'Please select an income category.',
  });
};

export const renderStudentEligibilityErrorMessage = (intlHook: IntlShape) => {
  return intlHook.formatMessage({
    id: 'errorMessage-studentEligibility',
    defaultMessage: 'Please select Yes or No.',
  });
};
