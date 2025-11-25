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
  renderIncomeCategoryHelperText,
  hasAtLeastOneTrue,
  validateNoneExclusive,
  validateHourlyIncome,
  validateIncomeAmount,
} from './validation';

/**
 * Creates an income source validation schema
 */
const createIncomeSourceSchema = (intl: IntlShape) => {
  return z
    .object({
      incomeCategory: z.string().min(1, { message: renderIncomeCategoryHelperText(intl) }),
      incomeStreamName: z.string().min(1, { message: renderIncomeStreamNameHelperText(intl) }),
      incomeFrequency: z.string().min(1, { message: renderIncomeFrequencyHelperText(intl) }),
      hoursPerWeek: z.string().trim(),
      incomeAmount: z
        .string()
        .trim()
        .refine(validateIncomeAmount, {
          message: renderIncomeAmountHelperText(intl),
        }),
    })
    .refine(
      (data) => validateHourlyIncome(data.incomeFrequency, data.hoursPerWeek),
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
    .refine(hasAtLeastOneTrue, {
      message: renderHealthInsSelectOneHelperText(intl),
    })
    .refine(validateNoneExclusive, {
      message: healthInsNonePlusHelperText,
    });
};

/**
 * Creates special conditions validation schema
 */
const createSpecialConditionsSchema = (intl: IntlShape) => {
  return z
    .object({
      student: z.boolean(),
      pregnant: z.boolean(),
      blindOrVisuallyImpaired: z.boolean(),
      disabled: z.boolean(),
      longTermDisability: z.boolean(),
      none: z.boolean().optional().default(false),
    })
    .refine(hasAtLeastOneTrue, {
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
    specialConditions: createSpecialConditionsSchema(intl),
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
