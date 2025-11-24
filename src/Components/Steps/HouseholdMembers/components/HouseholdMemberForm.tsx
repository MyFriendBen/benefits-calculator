import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import { useContext, useEffect, useRef } from 'react';
import { HouseholdData } from '../../../../Types/FormData';
import { Box } from '@mui/material';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import HouseholdMemberSummaryCards from './HouseholdMemberSummaryCards';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import * as z from 'zod';
import { SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useConfig } from '../../../Config/configHook';
import { FormattedMessageType } from '../../../../Types/Questions';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import {
  renderHealthInsSelectOneHelperText,
  renderHealthInsNonePlusHelperText,
  renderIncomeStreamNameHelperText,
  renderIncomeFrequencyHelperText,
  renderHoursWorkedHelperText,
  renderIncomeAmountHelperText,
  renderHealthInsNonePlusTheyHelperText,
  renderConditionsSelectOneHelperText,
} from '../utils/validation';
import useScreenApi from '../../../../Assets/updateScreen';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';
import { determineDefaultIncomeByAge } from '../../../AgeCalculation/AgeCalculation';
import { MAX_AGE } from '../../../../Assets/age';
import '../styles/PersonIncomeBlock.css';
import { useShouldRedirectToConfirmation } from '../../../QuestionComponents/questionHooks';
import useStepForm from '../../stepForm';
import {
  LocationState,
  HealthInsuranceOptions,
  ConditionOptions,
} from '../utils/types';
import { sortFrequencyOptions, calculateAge } from '../utils/calculations';
import { useIncomeStreamManagement } from '../hooks/useIncomeStreamManagement';
import HealthInsuranceSection from '../sections/HealthInsuranceSection';
import ConditionsSection from '../sections/ConditionsSection';
import IncomeSection from '../sections/IncomeSection';
import BasicInfoSection from '../sections/BasicInfoSection';

const HouseholdMemberForm = () => {
  const { formData } = useContext(Context);
  const { uuid, page, whiteLabel } = useParams<{ uuid: string; page: string; whiteLabel: string }>();
  const { updateScreen } = useScreenApi();
  const navigate = useNavigate();
  const location = useLocation();
  const intl = useIntl();
  const pageNumber = Number(page);

  const currentMemberIndex = pageNumber - 1;
  const householdMemberFormData = formData.householdData[currentMemberIndex] as HouseholdData | undefined;

  // Show basic info (birth date & relationship) when:
  // 1. Household size is 1 (only the user), OR
  // 2. User is editing from a summary card (location state indicates isEditing)
  const locationState = location.state as LocationState | null;
  const isEditing = locationState?.isEditing === true;
  const shouldShowBasicInfo = formData.householdSize === 1 || isEditing;

  const healthInsuranceOptions = useConfig<HealthInsuranceOptions>('health_insurance_options');
  const conditionOptions = useConfig<ConditionOptions>('condition_options');
  const incomeCategories = useConfig<Record<string, FormattedMessageType>>('income_categories');
  const incomeOptions = useConfig<Record<string, Record<string, FormattedMessageType>>>('income_options');
  const frequencyOptions = useConfig<Record<string, FormattedMessageType>>('frequency_options');
  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');

  const sortedFrequencyOptions = sortFrequencyOptions(frequencyOptions);
  const frequencyMenuItems = createMenuItems(
    sortedFrequencyOptions,
    <FormattedMessage id="personIncomeBlock.createFrequencyMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  );

  const redirectToConfirmationPage = useShouldRedirectToConfirmation();
  const currentStepId = useStepNumber('householdData');

  const backNavigationFunction = () => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }

    if (pageNumber === 1) {
      if (formData.householdSize === 1) {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
      } else {
        navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/0`);
      }
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber - 1}`);
    }
  };

  const nextStep = (uuid: string, currentStepId: number, pageNumber: number) => {
    if (redirectToConfirmationPage) {
      navigate(`/${whiteLabel}/${uuid}/confirm-information`);
      return;
    }

    // If user is editing from a summary card, return them to the page they came from
    const locationState = location.state as LocationState | null;
    if (locationState?.isEditing && locationState?.returnToPage !== undefined) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${locationState.returnToPage}`);
      return;
    }

    if (Number(pageNumber + 1) <= formData.householdSize) {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/${pageNumber + 1}`);
    } else {
      navigate(`/${whiteLabel}/${uuid}/step-${currentStepId + 1}`);
    }
  };

  // Validation schemas
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
          (value) => incomeAmountRegex.test(value) && Number(value) > 0,
          { message: renderIncomeAmountHelperText(intl) },
        ),
    })
    .refine(
      (data) => {
        if (data.incomeFrequency === 'hourly') {
          return oneOrMoreDigitsButNotAllZero.test(data.hoursPerWeek);
        }
        return true;
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
              .filter(([key]) => key !== 'none')
              .every(([, value]) => value === false);
          }
          return true;
        },
        { message: healthInsNonPlusHelperText },
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

  const determineDefaultHasIncome = (): string => {
    if (!householdMemberFormData) {
      return 'false';
    }

    // If member has income streams, they definitely have income
    if (householdMemberFormData.incomeStreams.length > 0) {
      return 'true';
    }

    // If member has health insurance selections, they've been through this page before
    // (income section comes before health insurance in the form flow)
    const hasProgressedThroughForm = householdMemberFormData.healthInsurance &&
      Object.values(householdMemberFormData.healthInsurance).some(v => v === true);

    if (hasProgressedThroughForm) {
      return householdMemberFormData.hasIncome ? 'true' : 'false';
    }

    // First time visiting this page - use age-based logic
    return determineDefaultIncomeByAge(householdMemberFormData);
  };

  // Default values
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
        birthMonth: householdMemberFormData?.birthMonth && householdMemberFormData.birthMonth > 0
          ? householdMemberFormData.birthMonth
          : 0,
        birthYear: householdMemberFormData?.birthYear && householdMemberFormData.birthYear > 0
          ? householdMemberFormData.birthYear
          : ('' as unknown as number),
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
    defaultValues: defaultValues as FormSchema,
    questionName: 'householdData',
    onSubmitSuccessfulOverride: () => {
      if (!uuid) {
        console.error('UUID is undefined');
        return;
      }
      nextStep(uuid, currentStepId, pageNumber);
    },
  });

  const watchHasIncome = watch('hasIncome');
  const hasTruthyIncome = watchHasIncome === 'true';

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'incomeStreams',
  });

  // Use custom hook for income stream management
  useIncomeStreamManagement({
    hasTruthyIncome,
    householdMemberFormData,
    getValues,
    append,
    replace,
  });

  // Reset form when navigating between pages
  const prevPageRef = useRef(pageNumber);
  useEffect(() => {
    if (prevPageRef.current !== pageNumber) {
      reset(defaultValues as FormSchema);
      prevPageRef.current = pageNumber;
    }
  }, [pageNumber, reset, defaultValues]);

  const formSubmitHandler: SubmitHandler<FormSchema> = async (memberData) => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }

    const updatedHouseholdData = [...formData.householdData];
    updatedHouseholdData[currentMemberIndex] = {
      ...memberData,
      id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
      frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
      birthYear: shouldShowBasicInfo && 'birthYear' in memberData
        ? (memberData.birthYear as number)
        : (householdMemberFormData?.birthYear ?? 0),
      birthMonth: shouldShowBasicInfo && 'birthMonth' in memberData
        ? (memberData.birthMonth as number)
        : (householdMemberFormData?.birthMonth ?? 0),
      relationshipToHH: shouldShowBasicInfo && 'relationshipToHH' in memberData
        ? (memberData.relationshipToHH as string)
        : (householdMemberFormData?.relationshipToHH ?? ''),
      hasIncome: memberData.hasIncome === 'true',
    } as HouseholdData;

    const updatedFormData = { ...formData, householdData: updatedHouseholdData };
    await updateScreen(updatedFormData);
  };

  const handleFormError = (formErrors: typeof errors) => {
    // Scroll to the first section with an error
    const errorSections = [
      { key: 'birthMonth', id: 'basic-info-section' },
      { key: 'birthYear', id: 'basic-info-section' },
      { key: 'relationshipToHH', id: 'basic-info-section' },
      { key: 'healthInsurance', id: 'health-insurance-section' },
      { key: 'conditions', id: 'conditions-section' },
      { key: 'hasIncome', id: 'income-section' },
      { key: 'incomeStreams', id: 'income-section' },
    ];

    for (const section of errorSections) {
      if ((formErrors as any)[section.key]) {
        const element = document.getElementById(section.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
    }

    // Fallback to scrolling to top if no section found
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Calculate age for header
  const age = calculateAge(householdMemberFormData?.birthYear, householdMemberFormData?.birthMonth);
  const relationship = householdMemberFormData?.relationshipToHH;
  const relationshipText = relationship && relationshipOptions?.[relationship];

  return (
    <main className="benefits-form">
      {pageNumber > 1 && (
        <section aria-label="Previous household members" style={{ marginBottom: '1.5rem' }}>
          <h2 className="question-label" style={{ marginBottom: '0.25rem' }}>
            <FormattedMessage id="householdDataBlock.soFarToldAbout" defaultMessage="So far you've told us about:" />
          </h2>
          <Box sx={{ marginBottom: '0.5rem' }}>
            <HouseholdMemberSummaryCards
              activeMemberData={{
                ...getValues(),
                id: formData.householdData[currentMemberIndex]?.id ?? crypto.randomUUID(),
                frontendId: formData.householdData[currentMemberIndex]?.frontendId ?? crypto.randomUUID(),
                birthYear: householdMemberFormData?.birthYear,
                birthMonth: householdMemberFormData?.birthMonth,
                relationshipToHH: householdMemberFormData?.relationshipToHH ?? '',
                hasIncome: Boolean(getValues().hasIncome),
              } as HouseholdData}
              triggerValidation={trigger}
              questionName="householdData"
            />
          </Box>
          <Box sx={{ borderBottom: '1px solid #e0e0e0', marginBottom: '0.75rem' }} />
        </section>
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
        onSubmit={handleSubmit(formSubmitHandler, handleFormError)}
      >
        {shouldShowBasicInfo && (
          <BasicInfoSection
            control={control}
            errors={errors}
            isFirstMember={pageNumber === 1}
            relationshipOptions={relationshipOptions}
          />
        )}

        <HealthInsuranceSection
          control={control}
          errors={errors}
          healthInsurance={watch('healthInsurance')}
          setValue={setValue}
          trigger={trigger}
          clearErrors={clearErrors}
          options={healthInsuranceOptions}
          pageNumber={pageNumber}
        />

        <ConditionsSection
          errors={errors}
          conditions={watch('conditions')}
          setValue={setValue}
          clearErrors={clearErrors}
          options={conditionOptions}
          pageNumber={pageNumber}
        />

        <IncomeSection
          control={control}
          errors={errors}
          fields={fields}
          append={append}
          remove={remove}
          watch={watch}
          setValue={setValue}
          incomeCategories={incomeCategories}
          incomeOptions={incomeOptions}
          frequencyMenuItems={frequencyMenuItems}
        />

        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default HouseholdMemberForm;
