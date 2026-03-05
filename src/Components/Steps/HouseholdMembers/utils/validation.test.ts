import {
  hasAtLeastOneTrue,
  validateNoneExclusive,
  validateHourlyIncome,
  validateIncomeAmount,
  ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO,
  INCOME_AMOUNT_REGEX,
} from './validation';

describe('hasAtLeastOneTrue', () => {
  it('returns true when one value is true', () => {
    expect(hasAtLeastOneTrue({ a: true, b: false })).toBe(true);
  });

  it('returns true when all values are true', () => {
    expect(hasAtLeastOneTrue({ a: true, b: true })).toBe(true);
  });

  it('returns false when all values are false', () => {
    expect(hasAtLeastOneTrue({ a: false, b: false })).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(hasAtLeastOneTrue({})).toBe(false);
  });

  it('handles single-key objects', () => {
    expect(hasAtLeastOneTrue({ none: true })).toBe(true);
    expect(hasAtLeastOneTrue({ none: false })).toBe(false);
  });
});

describe('validateNoneExclusive', () => {
  it('returns true when none is false regardless of other options', () => {
    expect(validateNoneExclusive({ none: false, employer: true })).toBe(true);
  });

  it('returns true when none is true and all others are false', () => {
    expect(validateNoneExclusive({ none: true, employer: false, medicaid: false })).toBe(true);
  });

  it('returns false when none is true and another option is also true', () => {
    expect(validateNoneExclusive({ none: true, employer: true, medicaid: false })).toBe(false);
  });

  it('returns false when none is true and multiple options are also true', () => {
    expect(validateNoneExclusive({ none: true, employer: true, medicaid: true })).toBe(false);
  });

  it('returns true for empty object', () => {
    expect(validateNoneExclusive({})).toBe(true);
  });

  it('returns true when only non-none keys are true', () => {
    expect(validateNoneExclusive({ employer: true, medicaid: true })).toBe(true);
  });
});

describe('validateHourlyIncome', () => {
  it('returns true for non-hourly frequency regardless of hoursPerWeek', () => {
    expect(validateHourlyIncome('weekly', '')).toBe(true);
    expect(validateHourlyIncome('monthly', '0')).toBe(true);
    expect(validateHourlyIncome('yearly', 'abc')).toBe(true);
  });

  it('returns true for hourly with valid hours', () => {
    expect(validateHourlyIncome('hourly', '40')).toBe(true);
    expect(validateHourlyIncome('hourly', '1')).toBe(true);
  });

  it('returns false for hourly with empty hours', () => {
    expect(validateHourlyIncome('hourly', '')).toBe(false);
  });

  it('returns false for hourly with zero hours', () => {
    expect(validateHourlyIncome('hourly', '0')).toBe(false);
  });

  it('returns false for hourly with all-zero string', () => {
    expect(validateHourlyIncome('hourly', '000')).toBe(false);
  });

  it('returns false for hourly with non-numeric hours', () => {
    expect(validateHourlyIncome('hourly', 'abc')).toBe(false);
  });

  it('returns false for hourly with negative hours', () => {
    expect(validateHourlyIncome('hourly', '-5')).toBe(false);
  });

  it('returns false for hourly with decimal hours', () => {
    // regex requires whole digits only
    expect(validateHourlyIncome('hourly', '40.5')).toBe(false);
  });
});

describe('validateIncomeAmount', () => {
  it('returns true for valid positive integers', () => {
    expect(validateIncomeAmount('100')).toBe(true);
    expect(validateIncomeAmount('1')).toBe(true);
    expect(validateIncomeAmount('9999999')).toBe(true);
  });

  it('returns true for valid decimal amounts', () => {
    expect(validateIncomeAmount('100.5')).toBe(true);
    expect(validateIncomeAmount('100.50')).toBe(true);
  });

  it('returns false for zero', () => {
    expect(validateIncomeAmount('0')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateIncomeAmount('')).toBe(false);
  });

  it('returns false for negative values', () => {
    expect(validateIncomeAmount('-100')).toBe(false);
  });

  it('returns false for non-numeric strings', () => {
    expect(validateIncomeAmount('abc')).toBe(false);
    expect(validateIncomeAmount('$100')).toBe(false);
  });

  it('returns false for numbers exceeding max length', () => {
    // 8+ digits before decimal not allowed
    expect(validateIncomeAmount('12345678')).toBe(false);
  });

  it('returns false for more than 2 decimal places', () => {
    expect(validateIncomeAmount('10.123')).toBe(false);
  });

  it('returns false for string with spaces', () => {
    expect(validateIncomeAmount('10 0')).toBe(false);
  });
});

describe('ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO regex', () => {
  it('matches positive integers', () => {
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('1')).toBe(true);
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('40')).toBe(true);
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('999')).toBe(true);
  });

  it('does not match zero', () => {
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('0')).toBe(false);
  });

  it('does not match all-zero strings', () => {
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('00')).toBe(false);
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('000')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('')).toBe(false);
  });

  it('does not match non-digit characters', () => {
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('1a')).toBe(false);
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('-1')).toBe(false);
  });

  it('matches numbers with leading zeros but non-zero value', () => {
    expect(ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test('01')).toBe(true);
  });
});
