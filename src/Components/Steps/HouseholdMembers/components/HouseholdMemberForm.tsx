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
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import useScreenApi from '../../../../Assets/updateScreen';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';
import '../styles/IncomeSection.css';
import { useShouldRedirectToConfirmation } from '../../../QuestionComponents/questionHooks';
import useStepForm from '../../stepForm';
import { LocationState } from '../utils/types';
import { sortFrequencyOptions, calculateAge, createHouseholdMemberData, scrollToFirstError } from '../utils/helpers';
import { useHouseholdMembersNavigation } from '../hooks/useHouseholdMembersNavigation';
import { useHouseholdMemberConfig } from '../hooks/useHouseholdMemberConfig';
import { createHouseholdMemberSchema } from '../utils/schema';
import { createDefaultValues } from '../utils/defaultValues';
import HealthInsuranceSection from '../sections/HealthInsuranceSection';
import SpecialConditionsSection from '../sections/SpecialConditionsSection';
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
  const {
    healthInsuranceOptions,
    conditionOptions,
    incomeCategories,
    incomeOptions,
    frequencyOptions,
    relationshipOptions,
  } = useHouseholdMemberConfig();

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

  const defaultValues = createDefaultValues(householdMemberFormData, shouldShowBasicInfo, pageNumber === 1);

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'incomeStreams',
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
    updatedHouseholdData[currentMemberIndex] = createHouseholdMemberData({
      memberData,
      currentMemberIndex,
      existingHouseholdData: formData.householdData,
      shouldShowBasicInfo,
      householdMemberFormData,
    });

    const updatedFormData = { ...formData, householdData: updatedHouseholdData };
    await updateScreen(updatedFormData);
  };

  const handleFormError = (formErrors: typeof errors) => {
    scrollToFirstError(formErrors);
  };

  // HEADER DISPLAY
  const age = calculateAge(householdMemberFormData?.birthYear, householdMemberFormData?.birthMonth);
  const relationship = householdMemberFormData?.relationshipToHH;
  const relationshipText = relationship && relationshipOptions?.[relationship];

  // RENDER
  return (
    <main className="benefits-form">
      {(pageNumber > 1 || (pageNumber === 1 && formData.householdSize > 1)) && (
        <section aria-label="Your household members" className="previous-members-section">
          <h2 className="question-label previous-members-heading">
            <FormattedMessage id="householdDataBlock.yourHousehold" defaultMessage="Your Household" />
          </h2>
          <p className="question-sub-label">
            <FormattedMessage id="householdDataBlock.clickToEdit" defaultMessage="Click any completed member to edit" />
          </p>
          <Box className="summary-cards-container">
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

        <SpecialConditionsSection
          errors={errors}
          specialConditions={watch('specialConditions')}
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
