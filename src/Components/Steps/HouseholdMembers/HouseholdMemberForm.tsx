import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import HHMSummaryCards from './HHMSummaryCards';
import { useNavigate, useParams } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import { ReactNode, useContext, useEffect, useMemo, useRef } from 'react';
import { Conditions, HealthInsurance, HouseholdData } from '../../../Types/FormData';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { useStepNumber } from '../../../Assets/stepDirectory';
import * as z from 'zod';
import { Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MONTHS } from './MONTHS';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../../SelectTiles/MultiSelectTiles';
import { useConfig } from '../../Config/configHook';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import { FormattedMessageType } from '../../../Types/Questions';
import HelpButton from '../../HelpBubbleIcon/HelpButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { createMenuItems } from '../SelectHelperFunctions/SelectHelperFunctions';
import {
  renderMissingBirthMonthHelperText,
  renderFutureBirthMonthHelperText,
  renderBirthYearHelperText,
  renderHealthInsSelectOneHelperText,
  renderHealthInsNonePlusHelperText,
  renderRelationshipToHHHelperText,
  renderIncomeStreamNameHelperText,
  renderIncomeFrequencyHelperText,
  renderHoursWorkedHelperText,
  renderIncomeAmountHelperText,
  renderHealthInsNonePlusTheyHelperText,
  renderStudentEligibilityErrorMessage,
  renderIncomeCategoryHelperText,
} from './HelperTextFunctions';
import { DOLLARS, handleNumbersOnly, numberInputProps, NUM_PAD_PROPS } from '../../../Assets/numInputHelpers';
import useScreenApi from '../../../Assets/updateScreen';
import { QUESTION_TITLES } from '../../../Assets/pageTitleTags';
import { getCurrentMonthYear, YEARS, MAX_AGE } from '../../../Assets/age';
import { useAgeCalculation } from '../../AgeCalculation/useAgeCalculation';
import { determineDefaultIncomeByAge } from '../../AgeCalculation/AgeCalculation';
import './PersonIncomeBlock.css';
import { useShouldRedirectToConfirmation } from '../../QuestionComponents/questionHooks';
import useStepForm from '../stepForm';
import { usePageTitle } from '../../Common/usePageTitle';

type StudentQuestion = {
  name: 'studentFullTime' | 'studentJobTrainingProgram' | 'studentHasWorkStudy' | 'studentWorks20PlusHrs';
  messageId: string;
  defaultMessage: string;
  ariaLabelId: string;
  ariaLabelDefault: string;
};

const STUDENT_QUESTIONS: StudentQuestion[] = [
  {
    name: 'studentFullTime',
    messageId: 'studentEligibility.enrolledHalfTime',
    defaultMessage:
      'Are {subject} enrolled half-time or more in a university, college, or community college as defined by the educational institution?',
    ariaLabelId: 'studentEligibility.enrolledHalfTime-ariaLabel',
    ariaLabelDefault: 'enrolled half-time or more',
  },
  {
    name: 'studentJobTrainingProgram',
    messageId: 'studentEligibility.jobTraining',
    defaultMessage: 'Is the program that {subject} are enrolled in a job training program?',
    ariaLabelId: 'studentEligibility.jobTraining-ariaLabel',
    ariaLabelDefault: 'job training program',
  },
  {
    name: 'studentHasWorkStudy',
    messageId: 'studentEligibility.workStudy',
    defaultMessage: 'Do {subject} have a federal or state work study program?',
    ariaLabelId: 'studentEligibility.workStudy-ariaLabel',
    ariaLabelDefault: 'work study program',
  },
  {
    name: 'studentWorks20PlusHrs',
    messageId: 'studentEligibility.works20Hours',
    defaultMessage:
      'Do {subject} work 20 or more hours per week in other employment, including self-employment? (If the hours {subject} work changes each week, do {subject} work at least 80 hours in a month?)',
    ariaLabelId: 'studentEligibility.works20Hours-ariaLabel',
    ariaLabelDefault: 'works 20 hours or more',
  },
];

type GetFormSchemaParams = {
  intl: ReturnType<typeof useIntl>;
  pageNumber: number;
  relationshipOptions: Record<string, FormattedMessageType>;
  currentYear: number;
  currentMonth: number;
};

const getFormSchema = ({
  intl,
  pageNumber,
  relationshipOptions,
  currentYear,
  currentMonth,
}: GetFormSchemaParams) => {
  const oneOrMoreDigitsButNotAllZero = /^(?!0+$)\d+$/;
  const incomeAmountRegex = /^\d{0,7}(?:\d\.\d{0,2})?$/;

  const incomeSourcesSchema = z
    .object({
      incomeCategory: z.string().min(1, { message: renderIncomeCategoryHelperText(intl) }),
      incomeStreamName: z.string().min(1, { message: renderIncomeStreamNameHelperText(intl) }),
      incomeFrequency: z.string().min(1, { message: renderIncomeFrequencyHelperText(intl) }),
      hoursPerWeek: z.string().trim(),
      incomeAmount: z
        .string()
        .trim()
        .refine(
          (value) => {
            return incomeAmountRegex.test(value) && Number(value) > 0;
          },
          { message: renderIncomeAmountHelperText(intl) },
        ),
    })
    .refine(
      (data) => {
        if (data.incomeFrequency === 'hourly') {
          return oneOrMoreDigitsButNotAllZero.test(data.hoursPerWeek);
        } else {
          return true;
        }
      },
      { message: renderHoursWorkedHelperText(intl), path: ['hoursPerWeek'] },
    );

  const incomeStreamsSchema = z.array(incomeSourcesSchema);
  const hasIncomeSchema = z.string().regex(/^true|false$/);

  let healthInsNonPlusHelperText = renderHealthInsNonePlusHelperText(intl);
  if (pageNumber !== 1) {
    healthInsNonPlusHelperText = renderHealthInsNonePlusTheyHelperText(intl);
  }

  return z
    .object({
      birthMonth: z.string().min(1, { message: renderMissingBirthMonthHelperText(intl) }),
      birthYear: z
        .string()
        .trim()
        .min(1, { message: renderBirthYearHelperText(intl) })
        .refine((value) => {
          const year = Number(value);
          const age = currentYear - year;
          return year <= currentYear && age < MAX_AGE;
        }),
      healthInsurance: z
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
        // The UI's exclusiveValues prop already enforces "none" mutual exclusivity,
        // but we keep this Zod refinement as a validation safety net.
        .refine(
          (insuranceOptions) => {
            if (insuranceOptions.none) {
              return Object.entries(insuranceOptions)
                .filter(([key, _]) => key !== 'none')
                .every(([_, value]) => value === false);
            }
            return true;
          },
          {
            message: healthInsNonPlusHelperText,
          },
        ),
      conditions: z.object({
        student: z.boolean(),
        pregnant: z.boolean(),
        blindOrVisuallyImpaired: z.boolean(),
        disabled: z.boolean(),
        longTermDisability: z.boolean(),
      }),
      studentEligibility: z.object({
        studentFullTime: z.union([z.boolean(), z.undefined()]),
        studentJobTrainingProgram: z.union([z.boolean(), z.undefined()]),
        studentHasWorkStudy: z.union([z.boolean(), z.undefined()]),
        studentWorks20PlusHrs: z.union([z.boolean(), z.undefined()]),
      }),
      relationshipToHH: z
        .string()
        .refine((value) => [...Object.keys(relationshipOptions)].includes(value) || pageNumber === 1, {
          message: renderRelationshipToHHHelperText(intl),
        }),
      hasIncome: hasIncomeSchema,
      incomeStreams: incomeStreamsSchema,
    })
    .refine(
      ({ birthMonth, birthYear }) => {
        if (Number(birthYear) === currentYear) {
          return Number(birthMonth) <= currentMonth;
        }
        return true;
      },
      { message: renderFutureBirthMonthHelperText(intl), path: ['birthMonth'] },
    )
    .superRefine(({ conditions, studentEligibility }, ctx) => {
      if (conditions.student) {
        const fields = STUDENT_QUESTIONS.map((q) => q.name);

        fields.forEach((field) => {
          if (studentEligibility[field] === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: renderStudentEligibilityErrorMessage(intl),
              path: ['studentEligibility', field],
            });
          }
        });
      }
    });
};

const FIELD_TO_SCROLL_ID: Record<string, string> = {
  relationshipToHH: 'field-relationshipToHH',
  birthMonth: 'field-birthMonth',
  birthYear: 'field-birthMonth',
  healthInsurance: 'field-healthInsurance',
  studentEligibility: 'field-studentEligibility',
  hasIncome: 'field-hasIncome',
  incomeStreams: 'field-hasIncome',
};

const scrollToFirstError = (errors: Record<string, unknown>) => {
  const firstErrorField = Object.keys(FIELD_TO_SCROLL_ID).find((field) => field in errors);
  const el = firstErrorField && document.getElementById(FIELD_TO_SCROLL_ID[firstErrorField]);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }
};

const HouseholdMemberForm = () => {
  const { formData } = useContext(Context);
  const { uuid, page, whiteLabel } = useParams();
  const { updateScreen } = useScreenApi();
  const navigate = useNavigate();
  const intl = useIntl();
  const pageNumber = Number(page);
  const currentMemberIndex = pageNumber - 1;
  const householdMemberFormData = formData.householdData[currentMemberIndex] as HouseholdData | undefined;
  const healthInsuranceOptions =
    useConfig<Record<'you' | 'them', Record<keyof HealthInsurance, { text: FormattedMessageType; icon: ReactNode }>>>(
      'health_insurance_options',
    );
  const conditionOptions =
    useConfig<Record<'you' | 'them', Record<keyof Conditions, { text: FormattedMessageType; icon: ReactNode }>>>(
      'condition_options',
    );
  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');
  const incomeCategories = useConfig<Record<string, FormattedMessageType>>('income_categories');
  const incomeOptionsByCategory = useConfig<Record<string, Record<string, FormattedMessageType>>>('income_options_by_category');
  const incomeCategoriesMenuItems = createMenuItems(
    incomeCategories,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectCategory" defaultMessage="Select category" />,
  );
  const frequencyOptions = useConfig<Record<string, FormattedMessageType>>('frequency_options');
  const frequencyMenuItems = createMenuItems(
    frequencyOptions,
    <FormattedMessage id="personIncomeBlock.createFrequencyMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  ).flat();
  const redirectToConfirmationPage = useShouldRedirectToConfirmation();

  const currentStepId = useStepNumber('householdData');
  const backNavigationFunction = () => {
    if (uuid === undefined) {
      throw new Error('uuid is undefined');
    }

    if (pageNumber <= 1) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`);
    }
  };
  const nextStep = (uuid: string | undefined, currentStepId: number, pageNumber: number) => {
    if (uuid === undefined) {
      throw new Error('uuid is undefined');
    }
    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    if (Number(pageNumber + 1) <= formData.householdSize) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber + 1}`);
      return;
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId + 1}`);
      return;
    }
  };

  const { CURRENT_MONTH, CURRENT_YEAR } = getCurrentMonthYear();
  // I added an empty string to the years array to fix the initial invalid Autocomplete value warning
  const YEARS_AND_INITIAL_EMPTY_STR = ['', ...YEARS];

  const autoCompleteOptions = useMemo(() => {
    return YEARS_AND_INITIAL_EMPTY_STR.map((year) => {
      return { label: year };
    });
  }, [YEARS]);

  const formSchema = useMemo(
    () =>
      getFormSchema({
        intl,
        pageNumber,
        relationshipOptions,
        currentYear: CURRENT_YEAR,
        currentMonth: CURRENT_MONTH,
      }),
    [intl, pageNumber, relationshipOptions, CURRENT_YEAR, CURRENT_MONTH],
  );

  type FormSchema = z.infer<typeof formSchema>;

  usePageTitle(QUESTION_TITLES.householdData);

  const determineDefaultRelationshipToHH = () => {
    if (householdMemberFormData && householdMemberFormData.relationshipToHH) {
      return householdMemberFormData.relationshipToHH;
    } else if (pageNumber === 1) {
      return 'headOfHousehold';
    } else {
      return '';
    }
  };

  const determineDefaultHasIncome = () => {
    if (householdMemberFormData === undefined) {
      return 'false';
    }

    if (householdMemberFormData.incomeStreams.length > 0) {
      return 'true';
    }
    return determineDefaultIncomeByAge(householdMemberFormData);    
  };

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    clearErrors,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthMonth: householdMemberFormData?.birthMonth ? String(householdMemberFormData.birthMonth) : '',
      birthYear: householdMemberFormData?.birthYear ? String(householdMemberFormData.birthYear) : '',
      healthInsurance: householdMemberFormData?.healthInsurance
        ? householdMemberFormData.healthInsurance
        : {
            none: false,
            employer: false,
            private: false,
            medicaid: false,
            medicare: false,
            chp: false,
            emergency_medicaid: false,
            family_planning: false,
            va: false,
            mass_health: false,
          },
      conditions: householdMemberFormData?.conditions
        ? householdMemberFormData.conditions
        : {
            student: false,
            pregnant: false,
            blindOrVisuallyImpaired: false,
            disabled: false,
            longTermDisability: false,
          },
      studentEligibility: {
        studentFullTime: householdMemberFormData?.studentEligibility?.studentFullTime ?? undefined,
        studentJobTrainingProgram: householdMemberFormData?.studentEligibility?.studentJobTrainingProgram ?? undefined,
        studentHasWorkStudy: householdMemberFormData?.studentEligibility?.studentHasWorkStudy ?? undefined,
        studentWorks20PlusHrs: householdMemberFormData?.studentEligibility?.studentWorks20PlusHrs ?? undefined,
      },
      relationshipToHH: determineDefaultRelationshipToHH(),
      hasIncome: determineDefaultHasIncome(),
      incomeStreams: (householdMemberFormData?.incomeStreams ?? []).map((stream) => ({
        ...stream,
        incomeCategory: stream.incomeCategory ?? '',
      })),
    },
    questionName: 'householdData',
    onSubmitSuccessfulOverride: () => nextStep(uuid, currentStepId, pageNumber),
  });
  const watchHasIncome = watch('hasIncome');
  const hasTruthyIncome = watchHasIncome === 'true';
  
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'incomeStreams',
  });

  useEffect(() => {
    const noIncomeStreamsAreListed = Number(getValues('incomeStreams').length === 0);
    if (hasTruthyIncome && noIncomeStreamsAreListed) {
      append({
        incomeCategory: '',
        incomeStreamName: '',
        incomeAmount: '',
        incomeFrequency: '',
        hoursPerWeek: '',
      });
    }

    if (!hasTruthyIncome) {
      replace([]);
    }
  }, [watchHasIncome, append, replace, getValues, hasTruthyIncome]);
  
  const { calculateCurrentAgeStatus } = useAgeCalculation(watch);
  
  // Check if user is 16+ when birth month/year changes and set hasIncome to 'true' if so
  const watchBirthMonth = watch('birthMonth');
  const watchBirthYear = watch('birthYear');
  
   useEffect(() => {
    const { is16OrOlder } = calculateCurrentAgeStatus();  
    const hasStreams = getValues('incomeStreams').length > 0;
    if (is16OrOlder) {
      setValue('hasIncome', 'true', { shouldDirty: true });
    } else if (!hasStreams) {
      setValue('hasIncome', 'false', { shouldDirty: true });
    }
  }, [watchBirthMonth, watchBirthYear, setValue, calculateCurrentAgeStatus, getValues]);

  // Watch student condition to conditionally show student eligibility questions
  const watchIsStudent = watch('conditions.student');

  // Reset student eligibility fields when student condition is deselected
  const prevIsStudent = useRef(watchIsStudent);

  useEffect(() => {
    // Only reset when explicitly deselecting student (was true, now false)
    if (prevIsStudent.current && !watchIsStudent) {
      setValue('studentEligibility', {
        studentFullTime: undefined,
        studentJobTrainingProgram: undefined,
        studentHasWorkStudy: undefined,
        studentWorks20PlusHrs: undefined,
      }, { shouldValidate: false });
    }
    prevIsStudent.current = watchIsStudent;
  }, [watchIsStudent]);


  const formSubmitHandler: SubmitHandler<FormSchema> = async (memberData) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    const updatedHouseholdData = [...formData.householdData];
    updatedHouseholdData[currentMemberIndex] = {
      ...memberData,
      id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
      frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
      birthYear: Number(memberData.birthYear),
      birthMonth: Number(memberData.birthMonth),
      hasIncome: memberData.hasIncome === 'true',
    };
    const updatedFormData = { ...formData, householdData: updatedHouseholdData };
    await updateScreen(updatedFormData);
  };

  const createAgeQuestion = () => {
    return (
      <Box id="field-birthMonth" sx={{ marginBottom: '1.5rem' }}>
        <QuestionQuestion>
          {pageNumber === 1 ? (
            <FormattedMessage
              id="householdDataBlock.createAgeQuestion-how-headOfHH"
              defaultMessage="Please enter your month and year of birth"
            />
          ) : (
            <FormattedMessage
              id="householdDataBlock.createAgeQuestion-how"
              defaultMessage="Please enter their month and year of birth"
            />
          )}
        </QuestionQuestion>
        <div className="age-input-container">
          <FormControl
            sx={{ mt: 1, mb: 2, mr: 2, minWidth: '13.125rem', maxWidth: '100%' }}
            error={errors.birthMonth !== undefined}
          >
            <InputLabel id="birth-month">
              <FormattedMessage id="ageInput.month.label" defaultMessage="Birth Month" />
            </InputLabel>
            <Controller
              name="birthMonth"
              control={control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    labelId="birth-month"
                    label={<FormattedMessage id="ageInput.month.label" defaultMessage="Birth Month" />}
                  >
                    {Object.entries(MONTHS).map(([key, value]) => {
                      return (
                        <MenuItem value={String(key)} key={key}>
                          {value}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {errors.birthMonth !== undefined && (
                    <FormHelperText sx={{ ml: 0 }}>
                      <ErrorMessageWrapper fontSize="1rem">{errors.birthMonth.message}</ErrorMessageWrapper>
                    </FormHelperText>
                  )}
                </>
              )}
            />
          </FormControl>
          <FormControl
            sx={{ mt: 1, mb: 2, minWidth: '13.125rem', maxWidth: '100%' }}
            error={errors.birthYear !== undefined}
          >
            <Controller
              name="birthYear"
              control={control}
              render={({ field }) => (
                <>
                  <Autocomplete
                    {...field}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    isOptionEqualToValue={(option, value) => option.label === value.label}
                    options={autoCompleteOptions}
                    getOptionLabel={(option) => option.label ?? ''}
                    value={{ label: field.value }}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.label);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (YEARS.includes(value)) {
                            // set value if the value is valid,
                            // so the user does not need to select an option if they type the whole year.
                            setValue('birthYear', value);
                          }
                        }}
                        label={<FormattedMessage id="ageInput.year.label" defaultMessage="Birth Year" />}
                        inputProps={{
                          ...params.inputProps,
                          ...numberInputProps(params.inputProps.onChange),
                        }}
                        error={errors.birthYear !== undefined}
                      />
                    )}
                  />
                  {errors.birthYear !== undefined && (
                    <FormHelperText sx={{ ml: 0 }}>
                      <ErrorMessageWrapper fontSize="1rem">{errors.birthYear.message}</ErrorMessageWrapper>
                    </FormHelperText>
                  )}
                </>
              )}
            />
          </FormControl>
        </div>
      </Box>
    );
  };

  const displayHealthCareQuestion = () => {
    if (pageNumber === 1) {
      return (
        <QuestionQuestion>
          <FormattedMessage
            id="questions.healthInsurance-you"
            defaultMessage="Which type of health insurance do you have?"
          />
        </QuestionQuestion>
      );
    } else {
      return (
        <QuestionQuestion>
          <FormattedMessage
            id="questions.healthInsurance-they"
            defaultMessage="What type of health insurance do they have?"
          />
        </QuestionQuestion>
      );
    }
  };

  const displayHealthInsuranceBlock = () => {
    const insuranceSource = pageNumber === 1 ? healthInsuranceOptions.you : healthInsuranceOptions.them;
    const insuranceTileOptions = Object.entries(insuranceSource).map(([key, option]) => ({
      value: key,
      text: option.text,
      icon: option.icon,
    }));

    return (
      <div id="field-healthInsurance" className="section-container">
        <Stack sx={{ padding: 0 }} className="section">
          {displayHealthCareQuestion()}
          <QuestionDescription>
            <FormattedMessage id="insurance.chooseAllThatApply" defaultMessage="Choose all that apply." />
          </QuestionDescription>
          {errors.healthInsurance !== undefined && (
            <FormHelperText sx={{ ml: 0 }}>
              <ErrorMessageWrapper fontSize="1rem">{errors.healthInsurance.message}</ErrorMessageWrapper>
            </FormHelperText>
          )}
          <MultiSelectTiles
            variant="square"
            exclusiveValues={['none']}
            options={insuranceTileOptions}
            values={watch('healthInsurance')}
            onChange={(values) => {
              setValue('healthInsurance', values as HealthInsurance, { shouldValidate: false, shouldDirty: true });
              clearErrors('healthInsurance');
            }}
          />
        </Stack>
      </div>
    );
  };

  const displayConditionsQuestion = () => {
    const formattedMsgId =
      pageNumber === 1
        ? 'householdDataBlock.createConditionsQuestion-do-these-apply-to-you'
        : 'householdDataBlock.createConditionsQuestion-do-these-apply';

    const formattedMsgDefaultMsg =
      pageNumber === 1 ? 'Do any of these apply to you?' : 'Do any of these apply to them?';

    const conditionSource = pageNumber === 1 ? conditionOptions.you : conditionOptions.them;
    const conditionTileOptions = Object.entries(conditionSource).map(([key, option]) => ({
      value: key,
      text: option.text,
      icon: option.icon,
    }));

    return (
      <Box id="field-studentEligibility" sx={{ marginTop: '1.5rem' }}>
        <QuestionQuestion>
          <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
        </QuestionQuestion>
        <QuestionDescription>
          <FormattedMessage
            id="householdDataBlock.createConditionsQuestion-pick"
            defaultMessage="Choose all that apply. If none apply, skip this question."
          />
        </QuestionDescription>
        <MultiSelectTiles
          variant="square"
          options={conditionTileOptions}
          values={watch('conditions')}
          onChange={(values) => {
            setValue('conditions', values as Conditions, { shouldDirty: true });
          }}
        />
        {watchIsStudent && createStudentEligibilityQuestions()}
      </Box>
    );
  };

  const createStudentEligibilityQuestions = () => {
    return (
      <Box sx={{ mt: 2, pl: 2, borderLeft: '3px solid #e0e0e0', fontSize: '1.12rem', '& .question-label': { fontSize: '1.12rem' } }}>
        <Box component="h4" sx={{ fontWeight: 700, mb: 2, mt: 0, fontSize: '1.13rem', color: 'text.primary' }}>
          <FormattedMessage id="studentEligibility.sectionTitle" defaultMessage="Student Information" />
        </Box>
        {STUDENT_QUESTIONS.map(({ name, messageId, defaultMessage, ariaLabelId, ariaLabelDefault }) => (
          <Box key={name} sx={{ pb: '1.5rem' }}>
            <Controller
              name={`studentEligibility.${name}`}
              control={control}
              render={({ field }) => (
                <FormControl component="fieldset" error={!!errors.studentEligibility?.[name]}>
                  <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
                    <FormattedMessage
                      id={messageId}
                      defaultMessage={defaultMessage}
                      values={{
                        subject: pageNumber === 1 ? 'you' : 'they',
                        possessive: pageNumber === 1 ? 'your' : 'their',
                      }}
                    />
                  </FormLabel>
                  <RadioGroup
                    {...field}
                    value={field.value === undefined ? '' : field.value ? 'true' : 'false'}
                    onChange={(e) => field.onChange(e.target.value === 'true')}
                    aria-label={intl.formatMessage({
                      id: ariaLabelId,
                      defaultMessage: ariaLabelDefault,
                    })}
                  >
                    <FormControlLabel
                      value="true"
                      control={<Radio size="small" />}
                      label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio size="small" />}
                      label={<FormattedMessage id="radiofield.label-no" defaultMessage="No" />}
                    />
                  </RadioGroup>
                  {errors.studentEligibility?.[name] && (
                    <FormHelperText sx={{ ml: 0 }}>
                      <ErrorMessageWrapper fontSize="1rem">
                        {errors.studentEligibility[name]?.message}
                      </ErrorMessageWrapper>
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Box>
        ))}
      </Box>
    );
  };

  const createHOfHRelationQuestion = () => {
    return (
      <Box id="field-relationshipToHH" sx={{ marginBottom: '1.5rem' }}>
        <QuestionQuestion>
          <FormattedMessage
            id="householdDataBlock.createHOfHRelationQuestion-relation"
            defaultMessage="What is the next person in your household's relationship to you?"
          />
        </QuestionQuestion>
        <FormControl sx={{ mt: 1, mb: 2, minWidth: '13.125rem', maxWidth: '100%' }} error={!!errors.relationshipToHH}>
          <InputLabel id="relation-to-hh-label">
            <FormattedMessage
              id="householdDataBlock.createDropdownCompProps-inputLabelText"
              defaultMessage="Relation"
            />
          </InputLabel>
          <Controller
            name="relationshipToHH"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  {...field}
                  labelId="relation-to-hh-label"
                  id="relationship-to-hh-select"
                  label={
                    <FormattedMessage
                      id="householdDataBlock.createDropdownCompProps-inputLabelText"
                      defaultMessage="Relation"
                    />
                  }
                  sx={{ backgroundColor: '#fff' }}
                >
                  <MenuItem value="" disabled>
                    <FormattedMessage id="select.placeholder" defaultMessage="Select" />
                  </MenuItem>
                  {Object.entries(relationshipOptions).map(([key, value]) => (
                    <MenuItem value={key} key={key}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
                {errors.relationshipToHH && (
                  <FormHelperText sx={{ ml: 0 }}>
                    <ErrorMessageWrapper fontSize="1rem">{errors.relationshipToHH.message}</ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </>
            )}
          />
        </FormControl>
      </Box>
    );
  };

  const createIncomeRadioQuestion = () => {
    const translatedAriaLabel = intl.formatMessage({
      id: 'householdDataBlock.createIncomeRadioQuestion-ariaLabel',
      defaultMessage: 'has an income',
    });

    const formattedMsgId =
      pageNumber === 1 ? 'questions.hasIncome' : 'householdDataBlock.createIncomeRadioQuestion-questionLabel';

    const formattedMsgDefaultMsg =
      pageNumber === 1
        ? 'Do you have an income?'
        : 'Does this individual in your household have significant income you have not already included?';

    // Get age status to conditionally show income disclaimer for 16+ users
    const { isUnder16 } = calculateCurrentAgeStatus();
    
    return (
      <Box id="field-hasIncome" className="section-container">
        <div className="section">
          <QuestionQuestion>
            <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
            <HelpButton>
              <FormattedMessage
                id="householdDataBlock.createIncomeRadioQuestion-questionDescription"
                defaultMessage="This includes money from jobs, alimony, investments, or gifts. Income is the money earned or received before deducting taxes"
              />
            </HelpButton>
          </QuestionQuestion>
          {pageNumber === 1 && (
            <QuestionDescription>
              <FormattedMessage
                id="householdDataBlock.createIncomeRadioQuestion-questionDescription.you"
                defaultMessage="Enter income for yourself. You can enter income for other household members later."
              />
            </QuestionDescription>
          )}
          <Controller
            name="hasIncome"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <>
              <RadioGroup {...field} aria-label={translatedAriaLabel} sx={{ marginBottom: '1rem' }}>
                <FormControlLabel
                  value={'true'}
                  control={<Radio />}
                  label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
                />
                <FormControlLabel
                  value={'false'}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormattedMessage id="radiofield.label-no" defaultMessage="No" />
                      {watchHasIncome === 'false' && !isUnder16 && (
                        <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary',  ml: 1 }}>
                          <FormattedMessage 
                            id="householdDataBlock.createIncomeRadioQuestion-noIncomeDisclaimer" 
                            defaultMessage="Income affects benefits. We can be more accurate if you tell us significant household income." 
                          />
                        </Box>
                      )}                      
                    </Box>
                  }
                />
              </RadioGroup>               
              </>
            )}
          />
        </div>
      </Box>
    );
  };

  const getIncomeStreamError = (index: number, fieldName: string) => {
    const incomeStreamsErrors = errors.incomeStreams as any;
    return incomeStreamsErrors?.[index]?.[fieldName];
  };

  return (
    <main className="benefits-form">
      <QuestionHeader>
        {pageNumber === 1 ? (
          <FormattedMessage id="householdDataBlock.questionHeader" defaultMessage="Tell us about yourself." />
        ) : (
          <FormattedMessage id="householdDataBlock.soFarToldAbout" defaultMessage="So far you've told us about:" />
        )}
      </QuestionHeader>

      {pageNumber > 1 && (
        <Box sx={{ marginBottom: '2rem' }}>
          <HHMSummaryCards
            activeMemberData={{
              ...getValues(),
              id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
              frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
              birthYear: getValues().birthYear ? Number(getValues().birthYear) : undefined,
              birthMonth: getValues().birthMonth ? Number(getValues().birthMonth) : undefined,
              hasIncome: Boolean(getValues().hasIncome),
            }}
            triggerValidation={trigger}
            questionName="householdData"
          />
        </Box>
      )}

      <form
        onSubmit={handleSubmit(formSubmitHandler, scrollToFirstError)}
      >
        {pageNumber !== 1 && createHOfHRelationQuestion()}
        {createAgeQuestion()}
        {displayHealthInsuranceBlock()}
        {displayConditionsQuestion()}
        <div>
          <Stack sx={{ margin: '1.5rem 0' }}>
            {createIncomeRadioQuestion()}
            {hasTruthyIncome && (
              <>
                {errors.incomeStreams && (
                  <FormHelperText sx={{ ml: 0, mb: 1 }}>
                    <ErrorMessageWrapper fontSize="1rem">
                      <FormattedMessage
                        id="householdDataBlock.incomeStreamsError"
                        defaultMessage="Please complete all income fields or remove this income source."
                      />
                    </ErrorMessageWrapper>
                  </FormHelperText>
                )}
                <Stack spacing={2} className="income-streams-stack">
                  {fields.map((field, index) => {
                    return (
                      <Box key={field.id} className="income-box">
                        <Box className="income-fields-container">
                          {/* Income Category */}
                          <Box className="income-category-container">
                            <Typography className="form-field-label" sx={{ fontSize: '0.875rem' }}>
                              <FormattedMessage id="personIncomeBlock.incomeCategory" defaultMessage="Income Category" />
                            </Typography>
                            <FormControl
                              fullWidth
                              size="small"
                              error={getIncomeStreamError(index, 'incomeCategory') !== undefined}
                            >
                              <Controller
                                name={`incomeStreams.${index}.incomeCategory`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    {...field}
                                    displayEmpty
                                    sx={{ backgroundColor: '#fff' }}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      setValue(`incomeStreams.${index}.incomeStreamName`, '');
                                    }}
                                  >
                                    {incomeCategoriesMenuItems}
                                  </Select>
                                )}
                              />
                            </FormControl>
                          </Box>

                          {/* Specific Type, Amount, Frequency */}
                          <Box className="income-fields-row">
                            <Box className="income-field-specific-type">
                              <Typography className="form-field-label" sx={{ fontSize: '0.875rem' }}>
                                <FormattedMessage id="personIncomeBlock.specificType" defaultMessage="Specific Type" />
                              </Typography>
                              <FormControl
                                fullWidth
                                size="small"
                                error={getIncomeStreamError(index, 'incomeStreamName') !== undefined}
                              >
                                <Controller
                                  name={`incomeStreams.${index}.incomeStreamName`}
                                  control={control}
                                  render={({ field }) => {
                                    const selectedCategory = watch('incomeStreams')[index]?.incomeCategory;
                                    const categoryOptions = selectedCategory && incomeOptionsByCategory[selectedCategory]
                                      ? incomeOptionsByCategory[selectedCategory]
                                      : {};
                                    const specificTypeMenuItems = createMenuItems(
                                      categoryOptions,
                                      <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectType" defaultMessage="Select type" />,
                                    );

                                    return (
                                      <Select
                                        {...field}
                                        displayEmpty
                                        sx={{ backgroundColor: '#fff' }}
                                        disabled={!selectedCategory}
                                      >
                                        {specificTypeMenuItems}
                                      </Select>
                                    );
                                  }}
                                />
                              </FormControl>
                            </Box>

                            <Box className="income-field-amount">
                              <Typography className="form-field-label" sx={{ fontSize: '0.875rem' }}>
                                <FormattedMessage id="personIncomeBlock.preTaxAmount" defaultMessage="Pre-Tax Amount" />
                              </Typography>
                              <Controller
                                name={`incomeStreams.${index}.incomeAmount`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    placeholder="0.00"
                                    inputProps={NUM_PAD_PROPS}
                                    onChange={handleNumbersOnly(field.onChange, DOLLARS)}
                                    sx={{ backgroundColor: '#fff' }}
                                    error={getIncomeStreamError(index, 'incomeAmount') !== undefined}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                  />
                                )}
                              />
                            </Box>

                            <Box className="income-field-frequency">
                              <Typography className="form-field-label" sx={{ fontSize: '0.875rem' }}>
                                <FormattedMessage id="personIncomeBlock.frequency" defaultMessage="Frequency" />
                              </Typography>
                              <FormControl
                                fullWidth
                                size="small"
                                error={getIncomeStreamError(index, 'incomeFrequency') !== undefined}
                              >
                                <Controller
                                  name={`incomeStreams.${index}.incomeFrequency`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select {...field} displayEmpty sx={{ backgroundColor: '#fff' }}>
                                      {frequencyMenuItems}
                                    </Select>
                                  )}
                                />
                              </FormControl>
                            </Box>
                          </Box>
                        </Box>

                        <IconButton
                          onClick={() => remove(index)}
                          className="income-delete-button"
                          aria-label="delete income source"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    );
                  })}

                  <Box sx={{ paddingTop: '0rem', paddingBottom: '1rem' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() =>
                        append({
                          incomeCategory: '',
                          incomeStreamName: '',
                          incomeAmount: '',
                          incomeFrequency: '',
                          hoursPerWeek: '',
                        })
                      }
                      startIcon={<AddIcon />}
                      type="button"
                      className="income-add-button"
                      sx={{
                        backgroundColor: 'var(--secondary-color)',
                        color: '#ffffff',
                        border: 'none',
                        '&:hover': {
                          backgroundColor: 'var(--hover-color)',
                          color: 'var(--primary-color)',
                          border: '1px solid var(--primary-color)',
                        },
                      }}
                    >
                      <FormattedMessage id="personIncomeBlock.return-addIncomeButton" defaultMessage="+ Add Another Income Source" />
                    </Button>
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </div>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default HouseholdMemberForm;
