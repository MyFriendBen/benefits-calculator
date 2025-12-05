import { formatPhoneNumber, generateNeedId } from './helpers';

describe('formatPhoneNumber', () => {
  describe('valid US phone numbers', () => {
    it('should format 10-digit US number', () => {
      expect(formatPhoneNumber('2025551234')).toBe('(202) 555-1234');
    });

    it('should format number with country code', () => {
      expect(formatPhoneNumber('+12025551234')).toBe('(202) 555-1234');
    });

    it('should format number with leading 1', () => {
      expect(formatPhoneNumber('12025551234')).toBe('(202) 555-1234');
    });

    it('should format number with dashes', () => {
      expect(formatPhoneNumber('202-555-1234')).toBe('(202) 555-1234');
    });

    it('should format number with dots', () => {
      expect(formatPhoneNumber('202.555.1234')).toBe('(202) 555-1234');
    });

    it('should format number with parentheses', () => {
      expect(formatPhoneNumber('(202) 555-1234')).toBe('(202) 555-1234');
    });

    it('should format number with spaces', () => {
      expect(formatPhoneNumber('202 555 1234')).toBe('(202) 555-1234');
    });

    it('should format number with mixed formatting', () => {
      expect(formatPhoneNumber('(202) 555.1234')).toBe('(202) 555-1234');
    });

    it('should format number with +1 and parentheses', () => {
      expect(formatPhoneNumber('+1 (202) 555-1234')).toBe('(202) 555-1234');
    });
  });

  describe('invalid or non-US phone numbers', () => {
    it('should return original for too few digits', () => {
      expect(formatPhoneNumber('555-1234')).toBe('555-1234');
    });

    it('should return original for too many digits', () => {
      expect(formatPhoneNumber('12025551234567')).toBe('12025551234567');
    });

    it('should return original for empty string', () => {
      expect(formatPhoneNumber('')).toBe('');
    });

    it('should return original for non-phone text', () => {
      expect(formatPhoneNumber('Call us today!')).toBe('Call us today!');
    });

    it('should return original for letters only', () => {
      expect(formatPhoneNumber('ABCDEFGHIJ')).toBe('ABCDEFGHIJ');
    });
  });

  describe('toll-free numbers', () => {
    it('should format 800 number', () => {
      expect(formatPhoneNumber('1-800-555-1234')).toBe('(800) 555-1234');
    });

    it('should format 888 number', () => {
      expect(formatPhoneNumber('888-555-1234')).toBe('(888) 555-1234');
    });

    it('should format 877 number', () => {
      expect(formatPhoneNumber('877-555-1234')).toBe('(877) 555-1234');
    });
  });
});

describe('generateNeedId', () => {
  it('should generate lowercase id with prefix', () => {
    expect(generateNeedId('Food Assistance')).toBe('need-food%20assistance');
  });

  it('should handle special characters', () => {
    expect(generateNeedId('Child & Family Services')).toBe('need-child%20%26%20family%20services');
  });

  it('should handle single word', () => {
    expect(generateNeedId('Housing')).toBe('need-housing');
  });
});
