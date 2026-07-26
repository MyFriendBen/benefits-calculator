import { z } from 'zod';
import { mfbZodResolver } from '../../../../Assets/analytics/mfbZodResolver';
import {
  hasAtLeastOneTrue,
  validateNoneExclusive,
  validateHourlyIncome,
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

  it('returns true for hourly with exactly 168 hours (max hours in a week)', () => {
    expect(validateHourlyIncome('hourly', '168')).toBe(true);
  });

  it('returns false for hourly with more than 168 hours', () => {
    expect(validateHourlyIncome('hourly', '169')).toBe(false);
  });
});

// The income-amount field is validated as an ordered chain (min → format regex →
// > 0), each rung emitting a distinct code so the Validation Errors card can tell
// a blank amount from a malformed one from a zero. This mirrors the chain in
// schema.ts and asserts the code a given input actually produces (zod reports the
// first failing rung).
describe('income amount validation codes', () => {
  const amountSchema = z.object({
    incomeAmount: z
      .string()
      .trim()
      .min(1, { message: 'required' })
      .refine((v) => v === '' || INCOME_AMOUNT_REGEX.test(v), { message: 'format', params: { code: 'invalid_format' } })
      .refine((v) => v === '' || Number(v) > 0, { message: 'positive', params: { code: 'must_be_positive' } }),
  });

  const codeFor = async (incomeAmount: string): Promise<string | undefined> => {
    const { errors } = (await mfbZodResolver(amountSchema)({ incomeAmount }, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    } as any)) as any;
    // .min(1) is a native zod rule → surfaces as `type` (too_small); the refines
    // stamp `errorCode`. collectFieldErrors reads errorCode first, else type.
    return errors.incomeAmount?.errorCode ?? errors.incomeAmount?.type;
  };

  it('blank → required (too_small)', async () => {
    expect(await codeFor('')).toBe('too_small');
  });

  it('malformed → invalid_format', async () => {
    expect(await codeFor('abc')).toBe('invalid_format');
    expect(await codeFor('$100')).toBe('invalid_format');
    expect(await codeFor('10.123')).toBe('invalid_format');
    expect(await codeFor('12345678')).toBe('invalid_format');
  });

  it('zero → must_be_positive (well-formed but not > 0)', async () => {
    expect(await codeFor('0')).toBe('must_be_positive');
  });

  it('valid amount → no error', async () => {
    expect(await codeFor('100')).toBeUndefined();
    expect(await codeFor('100.50')).toBeUndefined();
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
