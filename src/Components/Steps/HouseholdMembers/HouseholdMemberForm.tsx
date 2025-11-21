import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import HHMSummaryCards from './HHMSummaryCards';
import HouseholdMemberBasicInfoPage from './HouseholdMemberBasicInfoPage';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import { ReactNode, useContext, useEffect } from 'react';
import { ReactComponent as NoneIcon } from '../../../Assets/icons/General/OptionCard/HealthInsurance/none.svg';
import { Conditions, HealthInsurance, HouseholdData } from '../../../Types/FormData';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
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
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import RHFOptionCardGroup from '../../RHFComponents/RHFOptionCardGroup';
import { useConfig } from '../../Config/configHook';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import { FormattedMessageType } from '../../../Types/Questions';
import HelpButton from '../../HelpBubbleIcon/HelpButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { createMenuItems } from '../SelectHelperFunctions/SelectHelperFunctions';
import CloseButton from '../../CloseButton/CloseButton';
import {
  renderHealthInsSelectOneHelperText,
  renderHealthInsNonePlusHelperText,
  renderIncomeStreamNameHelperText,
  renderIncomeFrequencyHelperText,
  renderHoursWorkedHelperText,
  renderIncomeAmountHelperText,
  renderHealthInsNonePlusTheyHelperText,
  renderConditionsSelectOneHelperText,
} from './HelperTextFunctions';
import { DOLLARS, handleNumbersOnly, NUM_PAD_PROPS } from '../../../Assets/numInputHelpers';
import useScreenApi from '../../../Assets/updateScreen';
import { QUESTION_TITLES } from '../../../Assets/pageTitleTags';
import { determineDefaultIncomeByAge } from '../../AgeCalculation/AgeCalculation';
import { getCurrentMonthYear, YEARS, MAX_AGE } from '../../../Assets/age';
import { MONTHS } from './MONTHS';
import './PersonIncomeBlock.css';
import { useShouldRedirectToConfirmation } from '../../QuestionComponents/questionHooks';
import useStepForm from '../stepForm';

const HouseholdMemberForm = () => {
  const { formData } = useContext(Context);
  const { uuid, page, whiteLabel } = useParams();
  const { updateScreen } = useScreenApi();
  const navigate = useNavigate();
  const location = useLocation();
  const intl = useIntl();
  const pageNumber = Number(page);

  // If page is 0, show the basic info page for all members (but skip if household size is 1)
  if (pageNumber === 0 && formData.householdSize > 1) {
    return <HouseholdMemberBasicInfoPage />;
  }

  const currentMemberIndex = pageNumber - 1;
  const householdMemberFormData = formData.householdData[currentMemberIndex] as HouseholdData | undefined;

  // Show basic info (birth date & relationship) when:
  // 1. Household size is 1 (only the user), OR
  // 2. User is editing from a summary card (location state indicates isEditing)
  const isEditing = (location.state as any)?.isEditing === true;
  const shouldShowBasicInfo = formData.householdSize === 1 || isEditing;

  const healthInsuranceOptions =
    useConfig<Record<'you' | 'them', Record<keyof HealthInsurance, { text: FormattedMessageType; icon: ReactNode }>>>(
      'health_insurance_options',
    );
  const conditionOptions =
    useConfig<Record<'you' | 'them', Record<keyof Conditions, { text: FormattedMessageType; icon: ReactNode }>>>(
      'condition_options',
    );
  const incomeCategories = useConfig<Record<string, FormattedMessageType>>('income_categories');
  const incomeOptions = useConfig<Record<string, Record<string, FormattedMessageType>>>('income_options');
  const incomeCategoriesMenuItems = createMenuItems(
    incomeCategories,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectCategory" defaultMessage="Select category" />,
  );
  const frequencyOptions = useConfig<Record<string, FormattedMessageType>>('frequency_options');

  // Sort frequency options from least frequent to most frequent
  const frequencyOrder = ['once', 'yearly', 'monthly', 'semimonthly', 'biweekly', 'weekly', 'hourly'];
  const sortedFrequencyOptions: Record<string, FormattedMessageType> = {};

  // First add all options in the defined order
  frequencyOrder.forEach(key => {
    if (frequencyOptions[key]) {
      sortedFrequencyOptions[key] = frequencyOptions[key];
    }
  });

  // Then add any remaining options that weren't in the order array
  Object.keys(frequencyOptions).forEach(key => {
    if (!sortedFrequencyOptions[key]) {
      sortedFrequencyOptions[key] = frequencyOptions[key];
    }
  });

  const frequencyMenuItems = createMenuItems(
    sortedFrequencyOptions,
    <FormattedMessage id="personIncomeBlock.createFrequencyMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  );
  const redirectToConfirmationPage = useShouldRedirectToConfirmation();

  const currentStepId = useStepNumber('householdData');
  const backNavigationFunction = () => {
    if (uuid === undefined) {
      throw new Error('uuid is undefined');
    }

    if (pageNumber === 1) {
      // If household size is 1, go back to previous step; otherwise go to page 0
      if (formData.householdSize === 1) {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
      } else {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/0`);
      }
    } else {
      // Go back to previous household member page
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

  const oneOrMoreDigitsButNotAllZero = /^(?!0+$)\d+$/;
  const incomeAmountRegex = /^\d{0,7}(?:\d\.\d{0,2})?$/;
  const incomeSourcesSchema = z
    .object({
      incomeCategory: z.string().min(1, { message: 'Please select an income category' }),
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

  // Build schema conditionally based on whether basic info should be shown
  const baseSchema = {
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
    conditions: z
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
      }),
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

  const formSchema = z.object(schemaFields);
  type FormSchema = z.infer<typeof formSchema>;

  useEffect(() => {
    document.title = QUESTION_TITLES.householdData;
  }, []);

  const determineDefaultHasIncome = () => {
    if (householdMemberFormData === undefined) {
      return 'false';
    }

    // If member has income streams, they have income
    if (householdMemberFormData.incomeStreams.length > 0) {
      return 'true';
    }

    // If this member was already saved (has an id), use their saved hasIncome value
    // This prevents the form from auto-adding income box when editing someone who had no income
    if (householdMemberFormData.id) {
      return householdMemberFormData.hasIncome ? 'true' : 'false';
    }

    // For new members, determine based on age
    return determineDefaultIncomeByAge(householdMemberFormData);
  };

  // Default insurance and conditions values
  const defaultHealthInsurance = {
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
  };

  const defaultConditions = {
    student: false,
    pregnant: false,
    blindOrVisuallyImpaired: false,
    disabled: false,
    longTermDisability: false,
    none: false,
  };

  const baseDefaultValues = {
    healthInsurance: householdMemberFormData?.healthInsurance ?? defaultHealthInsurance,
    conditions: householdMemberFormData?.conditions ?? defaultConditions,
    hasIncome: determineDefaultHasIncome(),
    incomeStreams: householdMemberFormData?.incomeStreams ?? [],
  };

  const defaultValues = shouldShowBasicInfo
    ? {
        ...baseDefaultValues,
        birthMonth: (householdMemberFormData?.birthMonth && householdMemberFormData.birthMonth > 0) ? householdMemberFormData.birthMonth : 0,
        birthYear: (householdMemberFormData?.birthYear && householdMemberFormData.birthYear > 0) ? householdMemberFormData.birthYear : ('' as any),
        relationshipToHH: householdMemberFormData?.relationshipToHH ?? '',
      }
    : baseDefaultValues;

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    clearErrors,
    reset,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any,
    questionName: 'householdData',
    onSubmitSuccessfulOverride: () => nextStep(uuid, currentStepId, pageNumber),
  });
  const watchHasIncome = watch('hasIncome');
  const hasTruthyIncome = watchHasIncome === 'true';

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'incomeStreams',
  });

  // Reset form with saved data when component mounts or page changes
  // This ensures that when navigating back to edit, all saved values (including conditions) are reloaded
  useEffect(() => {
    reset(defaultValues as any);
  }, [pageNumber]);

  useEffect(() => {
    const noIncomeStreamsAreListed = getValues('incomeStreams').length === 0;

    // Only auto-add an income row if:
    // 1. User indicates they have income (hasTruthyIncome is true)
    // 2. There are no income streams listed
    // 3. This is NOT a return visit OR they had income before
    // Don't auto-add if user previously had no income (hasIncome was false)
    const hadIncomeOrIsNew = !householdMemberFormData?.id || householdMemberFormData.hasIncome === true;

    if (hasTruthyIncome && noIncomeStreamsAreListed && hadIncomeOrIsNew) {
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
  }, [watchHasIncome, append, replace, getValues, hasTruthyIncome, householdMemberFormData]);
  


  const formSubmitHandler: SubmitHandler<FormSchema> = async (memberData) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    const updatedHouseholdData = [...formData.householdData];
    updatedHouseholdData[currentMemberIndex] = {
      ...memberData,
      id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
      frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
      // Use values from form if basic info is shown, otherwise use existing data
      birthYear: shouldShowBasicInfo && 'birthYear' in memberData ? (memberData.birthYear as number) : (householdMemberFormData?.birthYear ?? 0),
      birthMonth: shouldShowBasicInfo && 'birthMonth' in memberData ? (memberData.birthMonth as number) : (householdMemberFormData?.birthMonth ?? 0),
      relationshipToHH: shouldShowBasicInfo && 'relationshipToHH' in memberData ? (memberData.relationshipToHH as string) : (householdMemberFormData?.relationshipToHH ?? ''),
      hasIncome: memberData.hasIncome === 'true',
    };
    const updatedFormData = { ...formData, householdData: updatedHouseholdData };
    await updateScreen(updatedFormData);
  };



  const displayHealthCareQuestion = () => {
    return (
      <QuestionQuestion>
        <FormattedMessage
          id="questions.healthInsurance"
          defaultMessage="Health Insurance"
        />
      </QuestionQuestion>
    );
  };

  const displayHealthInsuranceBlock = () => {
    return (
      <div className="section-container">
        <Stack sx={{ margin: '0.75rem 0', paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0' }} className="section">
          {displayHealthCareQuestion()}
          <QuestionDescription>
            <FormattedMessage id="insurance.chooseAllThatApply" defaultMessage="Choose all that apply." />
          </QuestionDescription>
          {errors.healthInsurance !== undefined && (
            <FormHelperText sx={{ ml: 0, mb: 1 }}>
              <ErrorMessageWrapper fontSize="1rem">{errors.healthInsurance.message}</ErrorMessageWrapper>
            </FormHelperText>
          )}
          <RHFOptionCardGroup
            fields={watch('healthInsurance')}
            setValue={setValue as unknown as (name: string, value: unknown, config?: Object) => void}
            name="healthInsurance"
            options={pageNumber === 1 ? healthInsuranceOptions.you : healthInsuranceOptions.them}
            triggerValidation={trigger}
            clearErrors={clearErrors}
          />
        </Stack>
      </div>
    );
  };

  const displayConditionsQuestion = () => {
    const noneOption = {
      none: {
        icon: <NoneIcon className="option-card-icon" />,
        text: (
          <FormattedMessage
            id="conditions.none"
            defaultMessage="I don't have any of these circumstances"
          />
        ),
      },
    };

    const conditionsWithNone = {
      ...noneOption,
      ...(pageNumber === 1 ? conditionOptions.you : conditionOptions.them),
    };

    return (
      <Box sx={{ margin: '0.75rem 0', paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
        <QuestionQuestion>
          <FormattedMessage
            id="householdDataBlock.specialCircumstances"
            defaultMessage="Special Circumstances"
          />
        </QuestionQuestion>
        <QuestionDescription>
          <FormattedMessage
            id="householdDataBlock.createConditionsQuestion-pick"
            defaultMessage="Choose all that apply."
          />
        </QuestionDescription>
        {errors.conditions !== undefined && (
          <FormHelperText sx={{ ml: 0, mb: 1 }}>
            <ErrorMessageWrapper fontSize="1rem">{errors.conditions.message}</ErrorMessageWrapper>
          </FormHelperText>
        )}
        <RHFOptionCardGroup
          fields={watch('conditions')}
          setValue={setValue as unknown as (name: string, value: unknown, config?: Object) => void}
          name="conditions"
          options={conditionsWithNone}
          clearErrors={clearErrors}
        />
      </Box>
    );
  };

  // Calculate age for header
  const calculateAge = (birthYear?: number, birthMonth?: number) => {
    if (!birthYear || !birthMonth) return null;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 0-indexed

    let age = currentYear - birthYear;
    if (currentMonth < birthMonth) {
      age--;
    }
    return age;
  };

  const age = calculateAge(householdMemberFormData?.birthYear, householdMemberFormData?.birthMonth);
  const relationship = householdMemberFormData?.relationshipToHH;

  // Get relationship display text from config
  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');
  const relationshipText = relationship && relationshipOptions && relationshipOptions[relationship];

  // Menu items for basic info fields (only needed when shouldShowBasicInfo is true)
  const monthMenuItems = shouldShowBasicInfo ? createMenuItems(
    MONTHS,
    <FormattedMessage id="ageInput.selectMonth" defaultMessage="Select Month" />
  ) : null;

  const yearMenuItems = shouldShowBasicInfo ? createMenuItems(
    YEARS.reduce((acc, year) => {
      acc[String(year)] = String(year);
      return acc;
    }, {} as Record<string, string>),
    <FormattedMessage id="ageInput.selectYear" defaultMessage="Select Year" />
  ) : null;

  return (
    <main className="benefits-form">
      {pageNumber > 1 && (
        <>
          <h2 className="question-label" style={{ marginBottom: '0.25rem' }}>
            <FormattedMessage id="householdDataBlock.soFarToldAbout" defaultMessage="So far you've told us about:" />
          </h2>
          <Box sx={{ marginBottom: '0.5rem' }}>
            <HHMSummaryCards
              activeMemberData={{
                ...getValues(),
                id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
                frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
                birthYear: householdMemberFormData?.birthYear,
                birthMonth: householdMemberFormData?.birthMonth,
                relationshipToHH: householdMemberFormData?.relationshipToHH ?? '',
                hasIncome: Boolean(getValues().hasIncome),
              }}
              triggerValidation={trigger}
              questionName="householdData"
            />
          </Box>
          <Box sx={{ borderBottom: '1px solid #e0e0e0', marginBottom: '0.75rem' }} />
        </>
      )}

      <QuestionHeader>
        {pageNumber === 1 || !relationshipText ? (
          <FormattedMessage id="householdDataBlock.questionHeader" defaultMessage="Tell us about yourself" />
        ) : (
          <>
            Tell us about your{' '}
            <span style={{ textTransform: 'lowercase' }}>{relationshipText}</span>
            {age !== null && `, age ${age}`}
          </>
        )}
      </QuestionHeader>

      <form
        key={`household-member-${pageNumber}`}
        onSubmit={handleSubmit(formSubmitHandler, () => {
          window.scroll({ top: 0, left: 0, behavior: 'smooth' });
        })}
      >
        {shouldShowBasicInfo && (
          <Box sx={{ margin: '0.75rem 0', paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
            <QuestionQuestion>
              <FormattedMessage id="householdDataBlock.basicInfo" defaultMessage="Basic Information" />
            </QuestionQuestion>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: '1rem', marginTop: '1rem' }}>
              {/* Birth Month */}
              <FormControl fullWidth error={(errors as any).birthMonth !== undefined}>
                <InputLabel>
                  <FormattedMessage id="ageInput.birthMonth" defaultMessage="Birth Month" />
                </InputLabel>
                <Controller
                  name={"birthMonth" as any}
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Birth Month">
                      {monthMenuItems}
                    </Select>
                  )}
                />
                {(errors as any).birthMonth && (
                  <FormHelperText>
                    <ErrorMessageWrapper fontSize="0.75rem">
                      {(errors as any).birthMonth.message}
                    </ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </FormControl>

              {/* Birth Year */}
              <FormControl fullWidth error={(errors as any).birthYear !== undefined}>
                <Controller
                  name={"birthYear" as any}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={<FormattedMessage id="ageInput.birthYear" defaultMessage="Birth Year" />}
                      variant="outlined"
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    />
                  )}
                />
                {(errors as any).birthYear && (
                  <FormHelperText>
                    <ErrorMessageWrapper fontSize="0.75rem">
                      {(errors as any).birthYear.message}
                    </ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </FormControl>

              {/* Relationship */}
              <FormControl fullWidth error={(errors as any).relationshipToHH !== undefined}>
                <InputLabel>
                  <FormattedMessage
                    id="householdDataBlock.relationshipToYou"
                    defaultMessage="Relationship to you"
                  />
                </InputLabel>
                <Controller
                  name={"relationshipToHH" as any}
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Relationship to you" disabled={pageNumber === 1}>
                      {pageNumber === 1 ? (
                        <MenuItem value="headOfHousehold">
                          <FormattedMessage id="relationship.self" defaultMessage="Self" />
                        </MenuItem>
                      ) : (
                        createMenuItems(
                          relationshipOptions,
                          <FormattedMessage
                            id="householdDataBlock.selectRelationship"
                            defaultMessage="Select relationship"
                          />
                        )
                      )}
                    </Select>
                  )}
                />
                {(errors as any).relationshipToHH && (
                  <FormHelperText>
                    <ErrorMessageWrapper fontSize="0.75rem">
                      {(errors as any).relationshipToHH.message}
                    </ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </FormControl>
            </Box>
          </Box>
        )}
        {displayHealthInsuranceBlock()}
        {displayConditionsQuestion()}
        <Box sx={{ margin: '0.75rem 0', paddingBottom: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
              <QuestionQuestion>
                <FormattedMessage id="householdDataBlock.incomeSources" defaultMessage="Income Sources" />
                <HelpButton>
                  <FormattedMessage
                    id="householdDataBlock.createIncomeRadioQuestion-questionDescription"
                    defaultMessage="This includes money from jobs, alimony, investments, or gifts. Income is the money earned or received before deducting taxes"
                  />
                </HelpButton>
              </QuestionQuestion>
              <QuestionDescription>
                <FormattedMessage
                  id="householdDataBlock.incomeSourcesDescription"
                  defaultMessage="Enter income for yourself. You can enter income for other household members later."
                />
              </QuestionDescription>
              <Stack spacing={2} sx={{ marginTop: '0.5rem' }}>
                {fields.map((field, index) => {
                  const selectedIncomeFrequency = watch('incomeStreams')[index].incomeFrequency;

                  return (
                    <Box
                      key={field.id}
                      sx={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        padding: '1rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        {/* First Row: Income Category */}
                        <Box sx={{ width: '100%' }}>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            Income Category
                          </Typography>
                          <FormControl
                            fullWidth
                            size="small"
                            error={errors.incomeStreams?.[index]?.incomeCategory !== undefined}
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
                                    // Reset specific type when category changes
                                    setValue(`incomeStreams.${index}.incomeStreamName`, '');
                                  }}
                                >
                                  {incomeCategoriesMenuItems}
                                </Select>
                              )}
                            />
                          </FormControl>
                        </Box>

                        {/* Second Row: Specific Type, Amount, Frequency */}
                        <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              Specific Type
                            </Typography>
                            <FormControl
                              fullWidth
                              size="small"
                              error={errors.incomeStreams?.[index]?.incomeStreamName !== undefined}
                            >
                              <Controller
                                name={`incomeStreams.${index}.incomeStreamName`}
                                control={control}
                                render={({ field }) => {
                                  const selectedCategory = watch('incomeStreams')[index]?.incomeCategory;
                                  const categoryOptions = selectedCategory && incomeOptions[selectedCategory]
                                    ? incomeOptions[selectedCategory]
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

                          <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              Amount
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
                                  error={errors.incomeStreams?.[index]?.incomeAmount !== undefined}
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                  }}
                                />
                              )}
                            />
                          </Box>

                          <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              Frequency
                            </Typography>
                            <FormControl
                              fullWidth
                              size="small"
                              error={errors.incomeStreams?.[index]?.incomeFrequency !== undefined}
                            >
                              <Controller
                                name={`incomeStreams.${index}.incomeFrequency`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    {...field}
                                    displayEmpty
                                    sx={{ backgroundColor: '#fff' }}
                                  >
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
                        sx={{ marginTop: '1.5rem' }}
                        aria-label="delete income source"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  );
                })}

                <Button
                  variant="outlined"
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
                  sx={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  <FormattedMessage id="personIncomeBlock.return-addIncomeButton" defaultMessage="+ Add Another Income Source" />
                </Button>
              </Stack>
        </Box>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default HouseholdMemberForm;
