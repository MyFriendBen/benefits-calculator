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
        .trim()
        .min(1),
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
        .trim()
        .min(1),
      email: z.preprocess(
        (val) => {
          if (typeof val === 'string') {
            const trimmed = val.trim();
            return trimmed === '' ? '' : trimmed;
          }
          return val;
        },
        z
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
          .or(z.literal(''))
      ),
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
      emailConsent: z.boolean(),
      tcpa: z.boolean(),
    })
    .refine(({ emailConsent, email }) => email === '' || emailConsent, {
      path: ['emailConsent'],
      message: formatMessage({ id: 'signUp.checkbox.error', defaultMessage: 'Please check the box to continue.' }),
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
    it('should fail validation with email only when email consent not checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        emailConsent: false,
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['emailConsent'],
          }),
        ])
      );
    });

    it('should pass validation with email when email consent is checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        emailConsent: true,
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should pass validation with no email and email consent unchecked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '1234567890',
        emailConsent: false,
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
        emailConsent: false,
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
        emailConsent: false,
        tcpa: true,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Both email and phone validation', () => {
    it('should fail validation with both email and phone when neither consent checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '1234567890',
        emailConsent: false,
        tcpa: false,
      };

      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['emailConsent'],
          }),
          expect.objectContaining({
            path: ['tcpa'],
          }),
        ])
      );
    });

    it('should pass validation with both email and phone when both consents checked', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '1234567890',
        emailConsent: true,
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
        emailConsent: false,
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
        emailConsent: false,
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
        emailConsent: false,
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
        emailConsent: true,
        tcpa: false,
      };

      const result = schema.safeParse(dataWithoutPhone);
      expect(result.success).toBe(true);
    });
  });

  describe('Email consent validation logic', () => {
    it('should require email consent when email is provided', () => {
      const dataWithEmail = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        emailConsent: false,
        tcpa: false,
      };

      const result = schema.safeParse(dataWithEmail);
      expect(result.success).toBe(false);
      expect(result.error?.issues.some(issue => issue.path.includes('emailConsent'))).toBe(true);
    });

    it('should not require email consent when no email is provided', () => {
      const dataWithoutEmail = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        cell: '1234567890',
        emailConsent: false,
        tcpa: true,
      };

      const result = schema.safeParse(dataWithoutEmail);
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
        emailConsent: false,
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
        emailConsent: false,
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
        emailConsent: true,
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
        emailConsent: true,
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

    it('should reject whitespace-only first name', () => {
      const data = {
        firstName: '   ',
        lastName: 'Doe',
        email: 'john@example.com',
        cell: '',
        emailConsent: true,
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

    it('should reject whitespace-only last name', () => {
      const data = {
        firstName: 'John',
        lastName: '   ',
        email: 'john@example.com',
        cell: '',
        emailConsent: true,
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

    it('should treat whitespace-only email as empty (valid)', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: '   ',
        cell: '1234567890',
        emailConsent: false,
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