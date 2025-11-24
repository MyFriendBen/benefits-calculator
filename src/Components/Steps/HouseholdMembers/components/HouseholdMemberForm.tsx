import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useLocation } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import { useContext, useEffect, useRef } from 'react';
import { HouseholdData } from '../../../../Types/FormData';
import { Box } from '@mui/material';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import HouseholdMemberSummaryCards from './HouseholdMemberSummaryCards';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import { useConfig } from '../../../Config/configHook';
import { FormattedMessageType } from '../../../../Types/Questions';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import useScreenApi from '../../../../Assets/updateScreen';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';
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
import { useHouseholdMembersNavigation } from '../hooks/useHouseholdMembersNavigation';
import { createHouseholdMemberSchema } from '../utils/schema';
import { createDefaultValues } from '../utils/defaultValues';
import { ERROR_SECTION_MAP } from '../utils/constants';
import HealthInsuranceSection from '../sections/HealthInsuranceSection';
import ConditionsSection from '../sections/ConditionsSection';
import IncomeSection from '../sections/IncomeSection';
import BasicInfoSection from '../sections/BasicInfoSection';

const HouseholdMemberForm = () => {
  // CONTEXT & ROUTING
  const { formData } = useContext(Context);
  const { uuid, page, whiteLabel } = useParams<{ uuid: string; page: string; whiteLabel: string }>();
  const { updateScreen } = useScreenApi();
  const location = useLocation();
  const intl = useIntl();
  const pageNumber = Number(page);

  // CURRENT MEMBER DATA
  const currentMemberIndex = pageNumber - 1;
  const householdMemberFormData = formData.householdData[currentMemberIndex] as HouseholdData | undefined;

  // Show basic info (birth date & relationship) when:
  // 1. Household size is 1 (only the user), OR
  // 2. User is editing from a summary card (location state indicates isEditing)
  const locationState = location.state as LocationState | null;
  const isEditing = locationState?.isEditing === true;
  const shouldShowBasicInfo = formData.householdSize === 1 || isEditing;

  // CONFIGURATION
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
  ).flat();

  const redirectToConfirmationPage = useShouldRedirectToConfirmation();
  const currentStepId = useStepNumber('householdData');

  // NAVIGATION
  const { navigateBack, navigateNext } = useHouseholdMembersNavigation({
    uuid,
    whiteLabel,
    currentStepId,
    pageNumber,
    redirectToConfirmationPage: redirectToConfirmationPage ?? false,
  });

  // FORM SETUP
  const formSchema = createHouseholdMemberSchema(intl, shouldShowBasicInfo, pageNumber);
  type FormSchema = typeof formSchema._type;

  const defaultValues = createDefaultValues(householdMemberFormData, shouldShowBasicInfo);

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
      navigateNext();
    },
  });

  const watchHasIncome = watch('hasIncome');
  const hasTruthyIncome = watchHasIncome === 'true';

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'incomeStreams',
  });

  // INCOME MANAGEMENT
  useIncomeStreamManagement({
    hasTruthyIncome,
    householdMemberFormData,
    getValues,
    append,
    replace,
  });

  // EFFECTS
  useEffect(() => {
    document.title = QUESTION_TITLES.householdData;
  }, []);

  // Reset form when navigating between pages
  const prevPageRef = useRef(pageNumber);
  useEffect(() => {
    if (prevPageRef.current !== pageNumber) {
      reset(defaultValues as FormSchema);
      prevPageRef.current = pageNumber;
    }
  }, [pageNumber, reset, defaultValues]);

  // FORM SUBMISSION
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
    for (const section of ERROR_SECTION_MAP) {
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

  // HEADER DISPLAY
  const age = calculateAge(householdMemberFormData?.birthYear, householdMemberFormData?.birthMonth);
  const relationship = householdMemberFormData?.relationshipToHH;
  const relationshipText = relationship && relationshipOptions?.[relationship];

  // RENDER
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

        <PrevAndContinueButtons backNavigationFunction={navigateBack} />
      </form>
    </main>
  );
};

export default HouseholdMemberForm;
