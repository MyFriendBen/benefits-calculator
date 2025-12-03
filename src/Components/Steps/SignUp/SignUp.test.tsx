import { z } from 'zod';
import { buildContactInfoSchema } from './SignUp';

// Mock useIntl hook
const mockFormatMessage = jest.fn((params) => {
  // Handle the specific message IDs we use in our validation
  const messageMap: { [key: string]: string } = {
    'validation-helperText.firstName': 'Please enter your first name',
    'validation-helperText.lastName': 'Please enter your last name',
    'validation-helperText.email': 'Please enter a valid email address',
    'validation-helperText.phoneNumber': 'Please enter a 10 digit phone number',
    'validation-helperText.email-required': 'Please enter an email',
    'validation-helperText.phone-required': 'Please enter a phone number',
    'validation-helperText.noEmailOrPhoneNumber': 'Please enter an email or phone number',
    'signUp.checkbox.error': 'Please check the box to continue.',
  };

  if (params && params.id && messageMap[params.id]) {
    return messageMap[params.id];
  }

  if (params && params.defaultMessage) {
    return params.defaultMessage;
  }

  return 'Invalid input';
});

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
}));

// Use the schema builder from SignUp component for testing
const createContactInfoSchema = () => buildContactInfoSchema(mockFormatMessage);

describe('SignUp Form Validation', () => {
  let schema: z.ZodType<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    schema = createContactInfoSchema();
  });

  describe('Email-only validation', () => {
    it('should pass validation with email only', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass validation with no email', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '1234567890',
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Phone-only validation', () => {
    it('should fail validation with phone only when TCPA not checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '1234567890',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['tcpa'],
          }),
        ]),
      );
    });

    it('should pass validation with phone when TCPA is checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '1234567890',
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Both email and phone validation', () => {
    it('should fail validation with both email and phone when TCPA not checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '1234567890',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['tcpa'],
          }),
        ]),
      );
    });

    it('should pass validation with both email and phone when TCPA checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '1234567890',
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Neither email nor phone validation', () => {
    it('should fail validation when neither email nor phone provided', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['email'],
          }),
        ]),
      );
    });

    it('should add error to both email and cell fields when neither email nor phone provided', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);

      // Should have error on email field
      const emailErrors = result.error?.issues.filter((issue) => issue.path.includes('email'));
      expect(emailErrors).toHaveLength(1);

      // Should have error on cell field but with empty message
      const cellErrors = result.error?.issues.filter((issue) => issue.path.includes('cell'));
      expect(cellErrors).toHaveLength(1);
      expect(cellErrors?.[0]?.message).toBe('');
    });
  });

  describe('New validation logic - SMS consent requirements', () => {
    describe('SMS consent checked', () => {
      it('should require phone when SMS consent is checked', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          cell: '',
          tcpa: true,
        };

        const result = schema.safeParse(data);
        expect(result.success).toBe(false);

        const cellErrors = result.error?.issues.filter((issue) => issue.path.includes('cell'));
        expect(cellErrors).toHaveLength(1);
      });

      it('should pass when phone provided with SMS consent', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          cell: '1234567890',
          tcpa: true,
        };

        const result = schema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('No SMS consent', () => {
      it('should require at least one contact method when no SMS consent', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          cell: '',
          tcpa: false,
        };

        const result = schema.safeParse(data);
        expect(result.success).toBe(false);

        const emailErrors = result.error?.issues.filter((issue) => issue.path.includes('email'));
        expect(emailErrors).toHaveLength(1);

        const cellErrors = result.error?.issues.filter((issue) => issue.path.includes('cell'));
        expect(cellErrors).toHaveLength(1);
        expect(cellErrors?.[0]?.message).toBe('');
      });

      it('should pass when email provided without SMS consent', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          cell: '',
          tcpa: false,
        };

        const result = schema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should fail when phone provided without SMS consent', () => {
        const data = {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          cell: '1234567890',
          tcpa: false,
        };

        const result = schema.safeParse(data);
        expect(result.success).toBe(false); // Should fail because SMS consent is required if phone is provided
      });
    });
  });

  describe('TCPA validation logic', () => {
    it('should require TCPA when phone number is provided', () => {
      const dataWithPhone = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '1234567890',
        tcpa: false,
      };

      const result = schema.safeParse(dataWithPhone);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((issue) => issue.path.includes('tcpa'))).toBe(true);
    });

    it('should not require TCPA when no phone number is provided', () => {
      const dataWithoutPhone = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(dataWithoutPhone);
      expect(result.success).toBe(true);
    });
  });

  describe('Phone number formatting', () => {
    it('should strip non-numeric characters from phone number', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '(123) 456-7890',
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cell).toBe('1234567890');
      }
    });

    it('should reject invalid phone number lengths', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '123456789', // 9 digits, should be 10
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['cell'],
          }),
        ]),
      );
    });
  });

  describe('Required field validation', () => {
    it('should require first name', () => {
      const data = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['firstName'],
          }),
        ]),
      );
    });

    it('should require last name', () => {
      const data = {
        firstName: 'John',
        lastName: '',
        email: 'john@example.com',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['lastName'],
          }),
        ]),
      );
    });

    it('should reject whitespace-only first name', () => {
      const data = {
        firstName: '   ',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['firstName'],
          }),
        ]),
      );
    });

    it('should reject whitespace-only last name', () => {
      const data = {
        firstName: 'John',
        lastName: '   ',
        email: 'john@example.com',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['lastName'],
          }),
        ]),
      );
    });

    it('should treat whitespace-only email as empty (valid)', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '   ',
        cell: '1234567890',
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('');
      }
    });
  });
});
