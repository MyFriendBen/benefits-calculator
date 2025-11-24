import * as z from 'zod';
import { IntlShape } from 'react-intl';
import { MAX_AGE } from '../../../../Assets/age';
import {
  renderHealthInsSelectOneHelperText,
  renderHealthInsNonePlusHelperText,
  renderHealthInsNonePlusTheyHelperText,
  renderIncomeStreamNameHelperText,
  renderIncomeFrequencyHelperText,
  renderHoursWorkedHelperText,
  renderIncomeAmountHelperText,
  renderConditionsSelectOneHelperText,
} from './validation';

// Regex patterns
const ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO = /^(?!0+$)\d+$/;
const INCOME_AMOUNT_REGEX = /^\d{0,7}(?:\d\.\d{0,2})?$/;

/**
 * Creates an income source validation schema
 */
const createIncomeSourceSchema = (intl: IntlShape) => {
  return z
    .object({
      incomeCategory: z.string().min(1, { message: 'Please select an income category' }),
      incomeStreamName: z.string().min(1, { message: renderIncomeStreamNameHelperText(intl) }),
      incomeFrequency: z.string().min(1, { message: renderIncomeFrequencyHelperText(intl) }),
      hoursPerWeek: z.string().trim(),
      incomeAmount: z
        .string()
        .trim()
        .refine((value) => INCOME_AMOUNT_REGEX.test(value) && Number(value) > 0, {
          message: renderIncomeAmountHelperText(intl),
        }),
    })
    .refine(
      (data) => {
        if (data.incomeFrequency === 'hourly') {
          return ONE_OR_MORE_DIGITS_BUT_NOT_ALL_ZERO.test(data.hoursPerWeek);
        }
        return true;
      },
      { message: renderHoursWorkedHelperText(intl), path: ['hoursPerWeek'] }
    );
};

/**
 * Creates health insurance validation schema
 */
const createHealthInsuranceSchema = (intl: IntlShape, pageNumber: number) => {
  const healthInsNonePlusHelperText =
    pageNumber === 1 ? renderHealthInsNonePlusHelperText(intl) : renderHealthInsNonePlusTheyHelperText(intl);

  return z
    .object({
      none: z.boolean(),
      employer: z.boolean().optional().default(false),
      private: z.boolean().optional().default(false),
      medicaid: z.boolean().optional().default(false),
      medicare: z.boolean().optional().default(false),
      chp: z.boolean().optional().default(false),
      emergency_medicaid: z.boolean().optional().default(false),
      family_planning: z.boolean().optional().default(false),
      va: z.boolean().optional().default(false),
      mass_health: z.boolean().optional().default(false),
    })
    .refine((insuranceOptions) => Object.values(insuranceOptions).some((option) => option === true), {
      message: renderHealthInsSelectOneHelperText(intl),
    })
    .refine(
      (insuranceOptions) => {
        if (insuranceOptions.none) {
          return Object.entries(insuranceOptions)
            .filter(([key]) => key !== 'none')
            .every(([, value]) => value === false);
        }
        return true;
      },
      { message: healthInsNonePlusHelperText }
    );
};

/**
 * Creates conditions validation schema
 */
const createConditionsSchema = (intl: IntlShape) => {
  return z
    .object({
      student: z.boolean(),
      pregnant: z.boolean(),
      blindOrVisuallyImpaired: z.boolean(),
      disabled: z.boolean(),
      longTermDisability: z.boolean(),
      none: z.boolean().optional().default(false),
    })
    .refine((conditionOptions) => Object.values(conditionOptions).some((option) => option === true), {
      message: renderConditionsSelectOneHelperText(intl),
    });
};

/**
 * Creates the household member form schema
 * @param intl - React Intl instance for internationalized error messages
 * @param shouldShowBasicInfo - Whether to include birth month/year and relationship fields
 * @param pageNumber - Current page number (affects validation messages)
 */
export const createHouseholdMemberSchema = (
  intl: IntlShape,
  shouldShowBasicInfo: boolean,
  pageNumber: number
) => {
  const incomeSourcesSchema = createIncomeSourceSchema(intl);
  const incomeStreamsSchema = z.array(incomeSourcesSchema);
  const hasIncomeSchema = z.string().regex(/^true|false$/);

  const baseSchema = {
    healthInsurance: createHealthInsuranceSchema(intl, pageNumber),
    conditions: createConditionsSchema(intl),
    hasIncome: hasIncomeSchema,
    incomeStreams: incomeStreamsSchema,
  };

  // Add basic info fields conditionally
  const schemaFields = shouldShowBasicInfo
    ? {
        ...baseSchema,
        birthMonth: z.number().min(1).max(12),
        birthYear: z.coerce.number().min(new Date().getFullYear() - MAX_AGE).max(new Date().getFullYear()),
        relationshipToHH: z.string().min(1, { message: 'Please select a relationship' }),
      }
    : baseSchema;

  return z.object(schemaFields);
};

/**
 * Type helper to infer the schema type
 */
export type HouseholdMemberFormSchema = z.infer<ReturnType<typeof createHouseholdMemberSchema>>;
