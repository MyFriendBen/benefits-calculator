import * as z from 'zod';
import { IntlShape } from 'react-intl';
import { MAX_AGE, getCurrentMonthYear } from '../../../../Assets/age';
import { FormattedMessageType } from '../../../../Types/Questions';
import {
  renderHealthInsSelectOneHelperText,
  renderHealthInsNonePlusHelperText,
  renderHealthInsNonePlusTheyHelperText,
  renderIncomeStreamNameHelperText,
  renderIncomeFrequencyHelperText,
  renderHoursWorkedHelperText,
  renderIncomeAmountHelperText,
  renderStudentEligibilityErrorMessage,
  renderMissingBirthMonthHelperText,
  renderFutureBirthMonthHelperText,
  renderBirthYearHelperText,
  renderInvalidBirthYearHelperText,
  renderRelationshipToHHHelperText,
  renderIncomeCategoryHelperText,
  hasAtLeastOneTrue,
  validateNoneExclusive,
  validateHourlyIncome,
  validateIncomeAmount,
} from './validation';

export type StudentQuestionName =
  | 'studentFullTime'
  | 'studentJobTrainingProgram'
  | 'studentHasWorkStudy'
  | 'studentWorks20PlusHrs';

export type StudentQuestion = {
  name: StudentQuestionName;
  /** Translation key/default when asking about the head of household (page 1). */
  messageIdYou: string;
  defaultMessageYou: string;
  /** Translation key/default when asking about another household member. */
  messageIdThey: string;
  defaultMessageThey: string;
  ariaLabelId: string;
  ariaLabelDefault: string;
};

// Note: each question has separate "-you" and "-they" translation keys
// (matching the ecHHMF.you-receiveSsi / ecHHMF.they-receiveSsi pattern) so the
// full sentence can be translated per language. Do not interpolate an English
// pronoun into the translated string — see MFB-1308.
export const STUDENT_QUESTIONS: StudentQuestion[] = [
  {
    name: 'studentFullTime',
    messageIdYou: 'studentEligibility.enrolledHalfTime-you',
    defaultMessageYou:
      'Are you enrolled half-time or more in a university, college, or community college as defined by the educational institution?',
    messageIdThey: 'studentEligibility.enrolledHalfTime-they',
    defaultMessageThey:
      'Are they enrolled half-time or more in a university, college, or community college as defined by the educational institution?',
    ariaLabelId: 'studentEligibility.enrolledHalfTime-ariaLabel',
    ariaLabelDefault: 'enrolled half-time or more',
  },
  {
    name: 'studentJobTrainingProgram',
    messageIdYou: 'studentEligibility.jobTraining-you',
    defaultMessageYou: 'Is the program that you are enrolled in a job training program?',
    messageIdThey: 'studentEligibility.jobTraining-they',
    defaultMessageThey: 'Is the program that they are enrolled in a job training program?',
    ariaLabelId: 'studentEligibility.jobTraining-ariaLabel',
    ariaLabelDefault: 'job training program',
  },
  {
    name: 'studentHasWorkStudy',
    messageIdYou: 'studentEligibility.workStudy-you',
    defaultMessageYou: 'Do you have a federal or state work study program?',
    messageIdThey: 'studentEligibility.workStudy-they',
    defaultMessageThey: 'Do they have a federal or state work study program?',
    ariaLabelId: 'studentEligibility.workStudy-ariaLabel',
    ariaLabelDefault: 'work study program',
  },
  {
    name: 'studentWorks20PlusHrs',
    messageIdYou: 'studentEligibility.works20Hours-you',
    defaultMessageYou:
      'Do you work 20 or more hours per week in other employment, including self-employment? (If the hours you work changes each week, do you work at least 80 hours in a month?)',
    messageIdThey: 'studentEligibility.works20Hours-they',
    defaultMessageThey:
      'Do they work 20 or more hours per week in other employment, including self-employment? (If the hours they work changes each week, do they work at least 80 hours in a month?)',
    ariaLabelId: 'studentEligibility.works20Hours-ariaLabel',
    ariaLabelDefault: 'works 20 hours or more',
  },
];

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
          params: { code: 'invalid_amount' },
        }),
    })
    .refine((data) => validateHourlyIncome(data.incomeFrequency, data.hoursPerWeek), {
      message: renderHoursWorkedHelperText(intl),
      path: ['hoursPerWeek'],
      params: { code: 'hours_required' },
    });
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
      params: { code: 'select_one' },
    })
    .refine(validateNoneExclusive, {
      message: healthInsNonePlusHelperText,
      params: { code: 'none_exclusive' },
    });
};

/**
 * Creates special conditions validation schema
 */
const createSpecialConditionsSchema = (_intl: IntlShape) => {
  return z.object({
    student: z.boolean().optional().default(false),
    pregnant: z.boolean().optional().default(false),
    blindOrVisuallyImpaired: z.boolean().optional().default(false),
    disabled: z.boolean().optional().default(false),
    longTermDisability: z.boolean().optional().default(false),
  });
};

/**
 * Creates the household member form schema
 * @param intl - React Intl instance for internationalized error messages
 * @param pageNumber - Current page number (affects validation messages)
 */
export const createHouseholdMemberSchema = (intl: IntlShape, pageNumber: number) => {
  const incomeSourcesSchema = createIncomeSourceSchema(intl);
  const incomeStreamsSchema = z.array(incomeSourcesSchema);

  const studentEligibilitySchema = z.object({
    studentFullTime: z.union([z.boolean(), z.undefined()]),
    studentJobTrainingProgram: z.union([z.boolean(), z.undefined()]),
    studentHasWorkStudy: z.union([z.boolean(), z.undefined()]),
    studentWorks20PlusHrs: z.union([z.boolean(), z.undefined()]),
  });

  return z
    .object({
      birthMonth: z
        .number()
        .min(1, { message: renderMissingBirthMonthHelperText(intl) })
        .max(12, { message: renderMissingBirthMonthHelperText(intl) }),
      birthYear: z
        .number({ invalid_type_error: renderBirthYearHelperText(intl) })
        .int()
        .min(new Date().getFullYear() - MAX_AGE + 1, { message: renderInvalidBirthYearHelperText(intl) })
        .max(new Date().getFullYear(), { message: renderInvalidBirthYearHelperText(intl) }),
      relationshipToHH: z.string().min(1, { message: renderRelationshipToHHHelperText(intl) }),
      healthInsurance: createHealthInsuranceSchema(intl, pageNumber),
      conditions: createSpecialConditionsSchema(intl),
      studentEligibility: studentEligibilitySchema,
      incomeStreams: incomeStreamsSchema,
    })
    .superRefine(({ birthMonth, birthYear, conditions, studentEligibility }, ctx) => {
      const { CURRENT_MONTH, CURRENT_YEAR } = getCurrentMonthYear();
      if (birthYear === CURRENT_YEAR && birthMonth > CURRENT_MONTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: renderFutureBirthMonthHelperText(intl),
          path: ['birthMonth'],
          params: { code: 'future_date' },
        });
      }

      if (conditions.student) {
        STUDENT_QUESTIONS.forEach(({ name }) => {
          if (studentEligibility[name] === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: renderStudentEligibilityErrorMessage(intl),
              path: ['studentEligibility', name],
              params: { code: 'incomplete' },
            });
          }
        });
      }
    });
};

/**
 * Creates the basic info page schema (birth month, birth year, relationship)
 * for all household members on the pre-detail page (page 0).
 */
export const createBasicInfoPageSchema = (intl: IntlShape) => {
  const { CURRENT_MONTH, CURRENT_YEAR } = getCurrentMonthYear();

  const memberSchema = z
    .object({
      birthMonth: z
        .number()
        .min(1, { message: renderMissingBirthMonthHelperText(intl) })
        .max(12, { message: renderMissingBirthMonthHelperText(intl) }),
      birthYear: z
        .number({ invalid_type_error: renderBirthYearHelperText(intl) })
        .int()
        .min(CURRENT_YEAR - MAX_AGE + 1, { message: renderInvalidBirthYearHelperText(intl) })
        .max(CURRENT_YEAR, { message: renderInvalidBirthYearHelperText(intl) }),
      relationshipToHH: z.string().min(1, { message: renderRelationshipToHHHelperText(intl) }),
    })
    .refine(
      ({ birthMonth, birthYear }) => {
        if (birthYear === CURRENT_YEAR) {
          return birthMonth <= CURRENT_MONTH;
        }
        return true;
      },
      { message: renderFutureBirthMonthHelperText(intl), path: ['birthMonth'] },
    );

  return z.object({ members: z.array(memberSchema) });
};

export type BasicInfoPageSchema = z.infer<ReturnType<typeof createBasicInfoPageSchema>>;

/**
 * Type helper to infer the schema type
 */
export type HouseholdMemberFormSchema = z.infer<ReturnType<typeof createHouseholdMemberSchema>>;
export type EnergyCalculatorHouseholdMemberFormSchema = z.infer<
  ReturnType<typeof createEnergyCalculatorHouseholdMemberSchema>
>;

// ============================================================================
// ENERGY CALCULATOR SCHEMA
// ============================================================================

/**
 * Creates the EC household member form schema.
 * EC workflow has different conditions (survivingSpouse, disabled, medicalEquipment),
 * no health insurance or student eligibility, and string-typed birth fields.
 */
export const createEnergyCalculatorHouseholdMemberSchema = (
  intl: IntlShape,
  pageNumber: number,
  relationshipOptions: Record<string, FormattedMessageType>,
) => {
  const { CURRENT_MONTH, CURRENT_YEAR } = getCurrentMonthYear();
  const incomeSourcesSchema = createIncomeSourceSchema(intl);
  const incomeStreamsSchema = z.array(incomeSourcesSchema);

  return z
    .object({
      birthMonth: z
        .number()
        .min(1, { message: renderMissingBirthMonthHelperText(intl) })
        .max(12, { message: renderMissingBirthMonthHelperText(intl) }),
      birthYear: z
        .number({ invalid_type_error: renderBirthYearHelperText(intl) })
        .int()
        .min(CURRENT_YEAR - MAX_AGE + 1, { message: renderInvalidBirthYearHelperText(intl) })
        .max(CURRENT_YEAR, { message: renderInvalidBirthYearHelperText(intl) }),
      conditions: z.object({
        survivingSpouse: z.boolean().optional().default(false),
        disabled: z.boolean().optional().default(false),
        medicalEquipment: z.boolean().optional().default(false),
      }),
      receivesSsi: z.enum(['true', 'false']).optional(),
      relationshipToHH: z
        .string()
        .refine((value) => [...Object.keys(relationshipOptions)].includes(value) || pageNumber === 1, {
          message: renderRelationshipToHHHelperText(intl),
        }),
      incomeStreams: incomeStreamsSchema,
    })
    .refine(
      ({ birthMonth, birthYear }) => {
        if (birthYear === CURRENT_YEAR) {
          return birthMonth <= CURRENT_MONTH;
        }
        return true;
      },
      { message: renderFutureBirthMonthHelperText(intl), path: ['birthMonth'] },
    );
};
