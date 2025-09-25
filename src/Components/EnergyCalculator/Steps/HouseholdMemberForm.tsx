import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import HHMSummaryCards from '../../Steps/HouseholdMembers/HHMSummaryCards';
import { useNavigate, useParams } from 'react-router-dom';
import { Context } from '../../Wrapper/Wrapper';
import { ReactNode, useContext, useEffect, useMemo } from 'react';
import { HouseholdData } from '../../../Types/FormData';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import { useStepNumber } from '../../../Assets/stepDirectory';
import * as z from 'zod';
import { Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MONTHS } from '../../Steps/HouseholdMembers/MONTHS';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../../OptionCardGroup/MultiSelectTiles';
import { useConfig } from '../../Config/configHook';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import { FormattedMessageType } from '../../../Types/Questions';
import HelpButton from '../../HelpBubbleIcon/HelpButton';
import AddIcon from '@mui/icons-material/Add';
import { createMenuItems } from '../../Steps/SelectHelperFunctions/SelectHelperFunctions';
import CloseButton from '../../CloseButton/CloseButton';
import {
  renderMissingBirthMonthHelperText,
  renderFutureBirthMonthHelperText,
  renderBirthYearHelperText,
  renderRelationshipToHHHelperText,
  renderIncomeStreamNameHelperText,
  renderIncomeFrequencyHelperText,
  renderHoursWorkedHelperText,
  renderIncomeAmountHelperText,
} from '../../Steps/HouseholdMembers/HelperTextFunctions';
import { DOLLARS, handleNumbersOnly, numberInputProps, NUM_PAD_PROPS } from '../../../Assets/numInputHelpers';
import useScreenApi from '../../../Assets/updateScreen';
import { QUESTION_TITLES } from '../../../Assets/pageTitleTags';
import { getCurrentMonthYear, YEARS, MAX_AGE } from '../../../Assets/age';
import { useAgeCalculation } from '../../AgeCalculation/useAgeCalculation';
import { determineDefaultIncomeByAge } from '../../AgeCalculation/AgeCalculation';
import '../../../Components/Steps/HouseholdMembers/PersonIncomeBlock.css';
import { useShouldRedirectToConfirmation } from '../../QuestionComponents/questionHooks';
import useStepForm from '../../Steps/stepForm';

const ECHouseholdMemberForm = () => {
  const { formData } = useContext(Context);
  const { uuid, page, whiteLabel } = useParams();
  const { updateScreen } = useScreenApi();
  const navigate = useNavigate();
  const intl = useIntl();
  const pageNumber = Number(page);
  const currentMemberIndex = pageNumber - 1;
  const householdMemberFormData = formData.householdData[currentMemberIndex] as HouseholdData | undefined;
  const conditionOptions =
    useConfig<Record<'you' | 'them', Record<string, { text: FormattedMessageType; icon: ReactNode }>>>(
      'condition_options',
    );
  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');
  const incomeOptions = useConfig<Record<string, FormattedMessageType>>('income_options');
  const incomeStreamsMenuItems = createMenuItems(
    incomeOptions,
    <FormattedMessage id="personIncomeBlock.createMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  );
  const frequencyOptions = useConfig<Record<string, FormattedMessageType>>('frequency_options');
  const frequencyMenuItems = createMenuItems(
    frequencyOptions,
    <FormattedMessage id="personIncomeBlock.createFrequencyMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  );
  const redirectToConfirmationPage = useShouldRedirectToConfirmation();

  const currentStepId = useStepNumber('energyCalculatorHouseholdData');
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

  const oneOrMoreDigitsButNotAllZero = /^(?!0+$)\d+$/;
  const incomeAmountRegex = /^\d{0,7}(?:\d\.\d{0,2})?$/;
  const incomeSourcesSchema = z
    .object({
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

  const formSchema = z
    .object({
      /*
    z.string().min(1) validates that an option was selected.
    The default value of birthMonth is '' when no option is selected.
    The possible values that can be selected are '1', '2', ..., '12',
    so if one of those options are selected,
    then birthMonth would have a minimum string length of 1 which passes validation.
    */
      birthMonth: z.string().min(1, { message: renderMissingBirthMonthHelperText(intl) }),
      birthYear: z
        .string()
        .trim()
        .min(1, { message: renderBirthYearHelperText(intl) })
        .refine((value) => {
          const year = Number(value);
          const age = CURRENT_YEAR - year;
          return year <= CURRENT_YEAR && age < MAX_AGE;
        }),
      conditions: z.object({
        survivingSpouse: z.boolean(),
        disabled: z.boolean(),
        medicalEquipment: z.boolean(),
      }),
      receivesSsi: z.enum(['true', 'false']).optional(),
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
        //this checks that the date they've selected is not in the future
        if (Number(birthYear) === CURRENT_YEAR) {
          return Number(birthMonth) <= CURRENT_MONTH;
        }
        return true;
      },
      { message: renderFutureBirthMonthHelperText(intl), path: ['birthMonth'] },
    );
  type FormSchema = z.infer<typeof formSchema>;

  useEffect(() => {
    document.title = QUESTION_TITLES.householdData;
  }, []);

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
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthMonth: householdMemberFormData?.birthMonth ? String(householdMemberFormData.birthMonth) : '',
      birthYear: householdMemberFormData?.birthYear ? String(householdMemberFormData.birthYear) : '',
      conditions: {
        survivingSpouse: householdMemberFormData?.energyCalculator?.survivingSpouse ?? false,
        disabled: householdMemberFormData?.conditions.disabled ?? false,
        medicalEquipment: householdMemberFormData?.energyCalculator?.medicalEquipment ?? false,
      },
      receivesSsi: householdMemberFormData?.energyCalculator?.receivesSsi ? 'true' : 'false',
      relationshipToHH: determineDefaultRelationshipToHH(),
      hasIncome: determineDefaultHasIncome(),
      incomeStreams: householdMemberFormData?.incomeStreams ?? [],
    },
    questionName: 'energyCalculatorHouseholdData',
    onSubmitSuccessfulOverride: () => nextStep(uuid, currentStepId, pageNumber),
  });
  const watchHasIncome = watch('hasIncome');
  const hasTruthyIncome = watchHasIncome === 'true';
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'incomeStreams',
  });
  const watchIsDisabled = watch('conditions.disabled');

  useEffect(() => {    
    const noIncomeStreamsAreListed = getValues('incomeStreams').length === 0;
    if (hasTruthyIncome && noIncomeStreamsAreListed) {
      append({
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

  // Check if user is 16+ when birth month/year changes and set hasIncome to 'true' if so
  const watchBirthMonth = watch('birthMonth');
  const watchBirthYear = watch('birthYear');
  const { calculateCurrentAgeStatus } = useAgeCalculation(watch);
  useEffect(() => {
    const { is16OrOlder } = calculateCurrentAgeStatus();
    const hasStreams = getValues('incomeStreams').length > 0;
    if (is16OrOlder) {
      setValue('hasIncome', 'true', { shouldDirty: true });
    } else if (!hasStreams) {
      setValue('hasIncome', 'false', { shouldDirty: true });
    }
}, [watchBirthMonth, watchBirthYear, setValue, calculateCurrentAgeStatus, getValues]);


  useEffect(() => {
    const notDisabled = getValues('conditions.disabled') === false;

    if (notDisabled) {
      setValue('receivesSsi', 'false');
    }
  }, [watchIsDisabled]);

  const formSubmitHandler: SubmitHandler<FormSchema> = async (memberData) => {
    if (uuid === undefined) {
      throw new Error('uuid is not defined');
    }

    const updatedMemberData: HouseholdData = {
      ...memberData,
      id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
      frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
      conditions: {
        ...memberData.conditions,
        disabled: memberData.conditions.disabled,
      },
      birthYear: Number(memberData.birthYear),
      birthMonth: Number(memberData.birthMonth),
      hasIncome: memberData.hasIncome === 'true',

      energyCalculator: {
        survivingSpouse: memberData.conditions.survivingSpouse,
        receivesSsi: memberData.receivesSsi === 'true',
        medicalEquipment: memberData.conditions.medicalEquipment,
      },
    };

    const updatedHouseholdData = [...formData.householdData];
    updatedHouseholdData[currentMemberIndex] = updatedMemberData;
    const updatedFormData = { ...formData, householdData: updatedHouseholdData };
    await updateScreen(updatedFormData);
  };

  const createAgeQuestion = () => {
    return (
      <Box sx={{ marginBottom: '1.5rem' }}>
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

  const displayConditionsQuestion = () => {
    const formattedMsgId =
      pageNumber === 1
        ? 'householdDataBlock.createConditionsQuestion-do-these-apply-to-you'
        : 'householdDataBlock.createConditionsQuestion-do-these-apply';

    const formattedMsgDefaultMsg =
      pageNumber === 1 ? 'Do any of these apply to you?' : 'Do any of these apply to them?';

    return (
      <div className="section-container">
        <Stack sx={{ padding: '3rem 0' }} className="section">
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
            options={Object.entries(pageNumber === 1 ? conditionOptions.you : conditionOptions.them).map(
              ([key, option]) => ({
                value: key,
                text: option.text,
                icon: option.icon,
              }),
            )}
            values={{
              survivingSpouse: Boolean(watch('conditions.survivingSpouse')),
              disabled: Boolean(watch('conditions.disabled')),
              medicalEquipment: Boolean(watch('conditions.medicalEquipment')),
            }}
            onChange={(newValues) => {
              // Create a new conditions object that preserves correct types
              const conditions = {
                survivingSpouse: newValues.survivingSpouse,
                disabled: newValues.disabled,
                medicalEquipment: newValues.medicalEquipment,
              };

              setValue('conditions', conditions, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </Stack>
        {getValues('conditions.disabled') && createReceivesSsiQuestion()}
      </div>
    );
  };

  const createHOfHRelationQuestion = () => {
    return (
      <Box sx={{ marginBottom: '1.5rem' }}>
        <QuestionQuestion>
          <FormattedMessage
            id="householdDataBlock.createHOfHRelationQuestion-relation"
            defaultMessage="What is this person’s relationship to you?"
          />
        </QuestionQuestion>
        <FormControl
          sx={{ mt: 1, mb: 2, minWidth: '13.125rem', maxWidth: '100%' }}
          error={errors.relationshipToHH !== undefined}
        >
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
                  labelId="relationship-To-HH"
                  label={
                    <FormattedMessage
                      id="householdDataBlock.createDropdownCompProps-label"
                      defaultMessage="Relation Type"
                    />
                  }
                >
                  {Object.entries(relationshipOptions).map(([key, value]) => {
                    return (
                      <MenuItem value={key} key={key}>
                        {value}
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.relationshipToHH !== undefined && (
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
      <Box className="section-container" sx={{ padding: '3rem 0' }}>
        <div>
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
            )}
          />
        </div>
      </Box>
    );
  };

  const renderIncomeStreamNameSelect = (index: number) => {
    return (
      <FormControl
        sx={{ minWidth: '13.125rem', maxWidth: '100%' }}
        error={errors.incomeStreams?.[index]?.incomeStreamName !== undefined}
      >
        <InputLabel id={`income-type-label-${index}`}>
          <FormattedMessage
            id="personIncomeBlock.createIncomeStreamsDropdownMenu-inputLabel"
            defaultMessage="Income Type"
          />
        </InputLabel>
        <Controller
          name={`incomeStreams.${index}.incomeStreamName`}
          control={control}
          render={({ field }) => (
            <>
              <Select
                {...field}
                labelId={`income-type-label-${index}`}
                id={`incomeStreams.${index}.incomeStreamName`}
                label={
                  <FormattedMessage
                    id="personIncomeBlock.createIncomeStreamsDropdownMenu-inputLabel"
                    defaultMessage="Income Type"
                  />
                }
                sx={{ backgroundColor: '#fff' }}
              >
                {incomeStreamsMenuItems}
              </Select>
              {errors.incomeStreams?.[index]?.incomeStreamName !== undefined && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="1rem">
                    {errors.incomeStreams?.[index]?.incomeStreamName?.message}
                  </ErrorMessageWrapper>
                </FormHelperText>
              )}
            </>
          )}
        />
      </FormControl>
    );
  };

  const getIncomeStreamSourceLabel = (incomeStreamName: string) => {
    if (incomeStreamName) {
      return (
        <>
          {'('}
          {incomeOptions[incomeStreamName]}
          {')'}?
        </>
      );
    }

    return '?';
  };

  const renderIncomeFrequencySelect = (selectedIncomeSource: string, index: number) => {
    let formattedMsgId = 'personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-youQLabel';
    let formattedMsgDefaultMsg = 'How often are you paid this income ';
    if (pageNumber !== 1) {
      formattedMsgId = 'personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-questionLabel';
      formattedMsgDefaultMsg = 'How often are they paid this income ';
    }

    return (
      <div>
        <div className="income-margin-bottom">
          <QuestionQuestion>
            <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
            {getIncomeStreamSourceLabel(selectedIncomeSource)}
            <HelpButton>
              <FormattedMessage
                id="personIncomeBlock.income-freq-help-text"
                defaultMessage='"Every 2 weeks" means you get paid every other week. "Twice a month" means you get paid two times a month on the same dates each month.'
              />
            </HelpButton>
          </QuestionQuestion>
        </div>
        <>
          <FormControl
            sx={{ minWidth: '13.125rem', maxWidth: '100%' }}
            error={errors.incomeStreams?.[index]?.incomeFrequency !== undefined}
          >
            <InputLabel id={`income-frequency-label-${index}`}>
              <FormattedMessage
                id="personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-freqLabel"
                defaultMessage="Frequency"
              />
            </InputLabel>
            <Controller
              name={`incomeStreams.${index}.incomeFrequency`}
              control={control}
              render={({ field }) => (
                <>
                  <Select
                    {...field}
                    labelId={`income-frequency-label-${index}`}
                    id={`incomeStreams.${index}.incomeFrequency`}
                    label={
                      <FormattedMessage
                        id="personIncomeBlock.createIncomeStreamFrequencyDropdownMenu-freqLabel"
                        defaultMessage="Frequency"
                      />
                    }
                    sx={{ backgroundColor: '#fff' }}
                  >
                    {frequencyMenuItems}
                  </Select>
                  {errors.incomeStreams?.[index]?.incomeFrequency !== undefined && (
                    <FormHelperText sx={{ ml: 0 }}>
                      <ErrorMessageWrapper fontSize="1rem">
                        {errors.incomeStreams?.[index]?.incomeFrequency?.message}
                      </ErrorMessageWrapper>
                    </FormHelperText>
                  )}
                </>
              )}
            />
          </FormControl>
        </>
      </div>
    );
  };

  const renderHoursPerWeekTextfield = (index: number, selectedIncomeSource: string) => {
    let formattedMsgId = 'personIncomeBlock.createHoursWorkedTextfield-youQLabel';
    let formattedMsgDefaultMsg = 'How many hours do you work per week ';

    if (pageNumber !== 1) {
      formattedMsgId = 'personIncomeBlock.createHoursWorkedTextfield-questionLabel';
      formattedMsgDefaultMsg = 'How many hours do they work per week ';
    }

    return (
      <>
        <div className="income-margin-bottom">
          <QuestionQuestion>
            <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
            {getIncomeStreamSourceLabel(selectedIncomeSource)}
          </QuestionQuestion>
        </div>
        <Controller
          name={`incomeStreams.${index}.hoursPerWeek`}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <>
              <TextField
                {...field}
                label={
                  <FormattedMessage id="incomeBlock.createHoursWorkedTextfield-amountLabel" defaultMessage="Hours" />
                }
                variant="outlined"
                inputProps={NUM_PAD_PROPS}
                onChange={handleNumbersOnly(field.onChange)}
                sx={{ backgroundColor: '#fff' }}
                error={errors.incomeStreams?.[index]?.hoursPerWeek !== undefined}
              />
              {errors.incomeStreams?.[index]?.hoursPerWeek !== undefined && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="1rem">
                    {errors.incomeStreams?.[index]?.hoursPerWeek?.message}
                  </ErrorMessageWrapper>
                </FormHelperText>
              )}
            </>
          )}
        />
      </>
    );
  };

  const renderIncomeAmountTextfield = (
    index: number,
    selectedIncomeFrequency: string,
    selectedIncomeStreamSource: string,
  ) => {
    let questionHeader;

    if (selectedIncomeFrequency === 'hourly') {
      let hourlyFormattedMsgId = 'incomeBlock.createIncomeAmountTextfield-hourly-questionLabel';
      let hourlyFormattedMsgDefaultMsg = 'What is your hourly rate ';

      if (pageNumber !== 1) {
        hourlyFormattedMsgId = 'personIncomeBlock.createIncomeAmountTextfield-hourly-questionLabel';
        hourlyFormattedMsgDefaultMsg = 'What is their hourly rate ';
      }

      questionHeader = <FormattedMessage id={hourlyFormattedMsgId} defaultMessage={hourlyFormattedMsgDefaultMsg} />;
    } else {
      let payPeriodFormattedMsgId = 'incomeBlock.createIncomeAmountTextfield-questionLabel';
      let payPeriodFormattedMsgDefaultMsg = 'How much do you receive before taxes each pay period for ';

      if (pageNumber !== 1) {
        payPeriodFormattedMsgId = 'personIncomeBlock.createIncomeAmountTextfield-questionLabel';
        payPeriodFormattedMsgDefaultMsg = 'How much do they receive before taxes each pay period for ';
      }

      questionHeader = (
        <FormattedMessage id={payPeriodFormattedMsgId} defaultMessage={payPeriodFormattedMsgDefaultMsg} />
      );
    }

    return (
      <div>
        <div className="income-textfield-margin-bottom">
          <QuestionQuestion>
            {questionHeader}
            {getIncomeStreamSourceLabel(selectedIncomeStreamSource)}
          </QuestionQuestion>
        </div>
        <Controller
          name={`incomeStreams.${index}.incomeAmount`}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <>
              <TextField
                {...field}
                label={
                  <FormattedMessage
                    id="personIncomeBlock.createIncomeAmountTextfield-amountLabel"
                    defaultMessage="Amount"
                  />
                }
                variant="outlined"
                inputProps={NUM_PAD_PROPS}
                onChange={handleNumbersOnly(field.onChange, DOLLARS)}
                sx={{ backgroundColor: '#fff' }}
                error={errors.incomeStreams?.[index]?.incomeAmount !== undefined}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { backgroundColor: '#FFFFFF' },
                }}
              />
              {errors.incomeStreams?.[index]?.incomeAmount !== undefined && (
                <FormHelperText sx={{ ml: 0 }}>
                  <ErrorMessageWrapper fontSize="1rem">
                    {errors.incomeStreams?.[index]?.incomeAmount?.message}
                  </ErrorMessageWrapper>
                </FormHelperText>
              )}
            </>
          )}
        />
      </div>
    );
  };

  const renderAdditionalIncomeBlockQ = () => {
    let formattedMsgId = 'incomeBlock.createIncomeBlockQuestions-questionLabel';
    let formattedMsgDefaultMsg = 'If you receive another type of income, select it below.';

    if (pageNumber !== 1) {
      formattedMsgId = 'personIncomeBlock.createIncomeBlockQuestions-questionLabel';
      formattedMsgDefaultMsg = 'If they receive another type of income, select it below.';
    }

    return (
      <div className="income-margin-bottom">
        <QuestionQuestion>
          <span className="income-stream-q-padding">
            <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
          </span>
        </QuestionQuestion>
      </div>
    );
  };

  const renderFirstIncomeBlockQ = () => {
    let formattedMsgId = 'questions.hasIncome-a';
    let formattedMsgDefaultMsg = 'What type of income have you had most recently?';

    if (pageNumber !== 1) {
      formattedMsgId = 'personIncomeBlock.return-questionLabel';
      formattedMsgDefaultMsg = 'What type of income have they had most recently?';
    }

    return (
      <div className="section top-padding-mb">
        <QuestionQuestion>
          <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
          <HelpButton>
            <FormattedMessage
              defaultMessage="Answer the best you can. You will be able to include additional types of income. The more you include, the more accurate your results will be."
              id="personIncomeBlock.return-questionDescription"
            />
          </HelpButton>
        </QuestionQuestion>
      </div>
    );
  };

  const createReceivesSsiQuestion = () => {
    const translatedAriaLabel = intl.formatMessage({
      id: 'ecHHMF.createReceivesSsiQuestion-ariaLabel',
      defaultMessage: 'has ssi',
    });
    const formattedMsgId = pageNumber === 1 ? 'ecHHMF.you-receiveSsi' : 'ecHHMF.they-receiveSsi';
    const formattedMsgDefaultMsg =
      pageNumber === 1
        ? 'Based on this disability, did you receive full benefits from Social Security, SSI, the Department of Human Services, or a public or private plan?'
        : 'Based on this disability, do they receive full benefits from Social Security, SSI, the Department of Human Services, or a public or private plan?';
    return (
      <Box sx={{ pb: '2rem' }}>
        <QuestionQuestion>
          <FormattedMessage id={formattedMsgId} defaultMessage={formattedMsgDefaultMsg} />
        </QuestionQuestion>
        <Controller
          name="receivesSsi"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <RadioGroup {...field} aria-label={translatedAriaLabel} sx={{ marginBottom: '1rem' }}>
              <FormControlLabel
                value={'true'}
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
              />
              <FormControlLabel
                value={'false'}
                control={<Radio />}
                label={<FormattedMessage id="radiofield.label-no" defaultMessage="No" />}
              />
            </RadioGroup>
          )}
        />
      </Box>
    );
  };

  return (
    <main className="benefits-form">
      <QuestionHeader>
        {pageNumber === 1 ? (
          <FormattedMessage id="householdDataBlock.questionHeader" defaultMessage="Tell us about yourself." />
        ) : (
          <FormattedMessage
            id="questions.householdData"
            defaultMessage="Tell us about the next person in your household."
          />
        )}
      </QuestionHeader>
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
        questionName="energyCalculatorHouseholdData"
      />
      <form
        onSubmit={handleSubmit(formSubmitHandler, () => {
          window.scroll({ top: 0, left: 0, behavior: 'smooth' });
        })}
      >
        {createAgeQuestion()}
        {pageNumber !== 1 && createHOfHRelationQuestion()}
        {displayConditionsQuestion()}
        <div>
          <Stack sx={{ margin: '3rem 0' }}>
            {createIncomeRadioQuestion()}
            {fields.map((field, index) => {
              const selectedIncomeStreamSource = watch('incomeStreams')[index].incomeStreamName;
              const selectedIncomeFrequency = watch('incomeStreams')[index].incomeFrequency;

              return (
                <div className="section-container income-block-container" key={field.id}>
                  <div className={index % 2 === 0 ? 'section' : ''}>
                    {index !== 0 && (
                      <div className="delete-button-container">
                        <CloseButton handleClose={() => remove(index)} />
                      </div>
                    )}
                    <div>
                      {index === 0 && renderFirstIncomeBlockQ()}
                      {index !== 0 && renderAdditionalIncomeBlockQ()}
                      {renderIncomeStreamNameSelect(index)}
                      {renderIncomeFrequencySelect(selectedIncomeStreamSource, index)}
                      {selectedIncomeFrequency === 'hourly' &&
                        renderHoursPerWeekTextfield(index, selectedIncomeStreamSource)}
                      {renderIncomeAmountTextfield(index, selectedIncomeFrequency, selectedIncomeStreamSource)}
                    </div>
                  </div>
                </div>
              );
            })}
            {hasTruthyIncome && (
              <div>
                <Button
                  variant="outlined"
                  onClick={() =>
                    append({
                      incomeStreamName: '',
                      incomeAmount: '',
                      incomeFrequency: '',
                      hoursPerWeek: '',
                    })
                  }
                  startIcon={<AddIcon />}
                  type="button"
                >
                  <FormattedMessage id="personIncomeBlock.return-addIncomeButton" defaultMessage="Add another income" />
                </Button>
              </div>
            )}
          </Stack>
        </div>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default ECHouseholdMemberForm;
