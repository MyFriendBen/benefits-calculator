import { z } from 'zod';

// Mock useIntl hook
const mockFormatMessage = jest.fn((params) => params.defaultMessage);

jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
}));

// Extract the validation schema from SignUp component for testing
const createContactInfoSchema = () => {
  const formatMessage = mockFormatMessage;
  
  return z
    .object({
      firstName: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.firstName',
                defaultMessage: 'Please enter your first name',
              }),
            };
          },
        })
        .min(1)
        .trim(),
      lastName: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.lastName',
                defaultMessage: 'Please enter your last name',
              }),
            };
          },
        })
        .min(1)
        .trim(),
      email: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.email',
                defaultMessage: 'Please enter a valid email address',
              }),
            };
          },
        })
        .email()
        .trim()
        .or(z.literal('')),
      cell: z
        .string({
          errorMap: () => {
            return {
              message: formatMessage({
                id: 'validation-helperText.phoneNumber',
                defaultMessage: 'Please enter a 10 digit phone number',
              }),
            };
          },
        })
        .trim()
        .transform((value) => {
          let newString = '';

          for (const char of value) {
            if (/\d/.test(char)) {
              newString += char;
            }
          }

          return newString;
        })
        .refine((value) => value.length === 0 || value.length === 10, {
          message: formatMessage({
            id: 'validation-helperText.phoneNumber',
            defaultMessage: 'Please enter a 10 digit phone number',
          }),
        }),
      tcpa: z.boolean(),
    })
    .refine(({ tcpa, cell }) => cell === '' || tcpa, {
      path: ['tcpa'],
      message: formatMessage({ id: 'signUp.checkbox.error', defaultMessage: 'Please check the box to continue.' }),
    })
    .superRefine(({ email, cell }, ctx) => {
      const noEmailAndCell = email.length === 0 && cell.length === 0;
      const message = formatMessage({
        id: 'validation-helperText.noEmailOrPhoneNumber',
        defaultMessage: 'Please enter an email or phone number',
      });

      if (noEmailAndCell) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message,
          path: ['email'],
        });
        return false;
      }

      return true;
    });
};

describe('SignUp Form Validation', () => {
  let schema: z.ZodType<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    schema = createContactInfoSchema();
  });

  describe('Email-only validation', () => {
    it('should pass validation with email only (no TCPA required)', () => {
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

    it('should pass validation with email and TCPA checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
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
        ])
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
        ])
      );
    });

    it('should pass validation with both email and phone when TCPA is checked', () => {
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
        ])
      );
    });

    it('should not add error to cell field when neither email nor phone provided', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '',
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      
      // Should only have error on email field, not cell field
      const cellErrors = result.error?.issues.filter(issue => issue.path.includes('cell'));
      expect(cellErrors).toHaveLength(0);
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
      expect(result.error?.issues.some(issue => issue.path.includes('tcpa'))).toBe(true);
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
        ])
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
        ])
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
        ])
      );
    });
  });
});