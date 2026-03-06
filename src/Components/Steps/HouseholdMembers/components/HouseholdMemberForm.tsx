import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useLocation } from 'react-router-dom';
import { Context } from '../../../Wrapper/Wrapper';
import { useContext } from 'react';
import { HouseholdData } from '../../../../Types/FormData';
import { Box } from '@mui/material';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import HouseholdMemberSummaryCards from './HouseholdMemberSummaryCards';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { SubmitHandler, useFieldArray, useWatch } from 'react-hook-form';
import { useAgeCalculation } from '../../../AgeCalculation/useAgeCalculation';
import { zodResolver } from '@hookform/resolvers/zod';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import useScreenApi from '../../../../Assets/updateScreen';
import '../styles/IncomeSection.css';
import { useShouldRedirectToConfirmation } from '../../../QuestionComponents/questionHooks';
import useStepForm from '../../stepForm';
import { WorkflowType, LocationState } from '../utils/types';
import { calculateAge, createHouseholdMemberData, scrollToFirstError } from '../utils/helpers';
import { useHouseholdMembersNavigation } from '../hooks/useHouseholdMembersNavigation';
import { useHouseholdMemberConfig } from '../hooks/useHouseholdMemberConfig';
import { useHouseholdMemberFormEffects } from '../hooks/useHouseholdMemberFormEffects';
import { createHouseholdMemberSchema, createEnergyCalculatorHouseholdMemberSchema } from '../utils/schema';
import { createDefaultValues, createEnergyCalculatorDefaultValues } from '../utils/defaultValues';
import { useIsEnergyCalculator } from '../../../EnergyCalculator/hooks';
import HealthInsuranceSection from '../sections/HealthInsuranceSection';
import SpecialConditionsSection from '../sections/SpecialConditionsSection';
import StudentEligibilitySection from '../sections/StudentEligibilitySection';
import IncomeSection from '../sections/IncomeSection';
import BasicInfoSection from '../sections/BasicInfoSection';

const HouseholdMemberForm = () => {
  const isEnergyCalculatorWL = useIsEnergyCalculator();
  const workflowType: WorkflowType = isEnergyCalculatorWL ? 'energyCalculator' : 'main';
  const isEnergyCalculator = workflowType === 'energyCalculator';

  // CONTEXT & ROUTING
  const { formData } = useContext(Context);
  const { uuid, page, whiteLabel } = useParams<{ uuid: string; page: string; whiteLabel: string }>();
  const location = useLocation();
  const { updateScreen } = useScreenApi();
  const intl = useIntl();
  const pageNumber = Number(page);
  const locationState = location.state as LocationState | null;
  const isEditing = !!locationState?.isEditing || !!locationState?.routedFromConfirmationPg;
  const basicInfoCollected = !!locationState?.basicInfoCollected;
  // Show BasicInfoSection when householdSize === 1 and they came directly from step 4 (skipping page 0),
  // or when editing a member. basicInfoCollected means they went through page 0 already.
  const showBasicInfoSection = (formData.householdSize === 1 && !basicInfoCollected) || isEditing;

  // CURRENT MEMBER DATA
  const currentMemberIndex = pageNumber - 1;
  const householdMemberFormData = formData.householdData[currentMemberIndex] as HouseholdData | undefined;

  // CONFIGURATION
  const {
    healthInsuranceOptions,
    conditionOptions,
    incomeOptions,
    frequencyMenuItems,
    relationshipOptions,
  } = useHouseholdMemberConfig();

  const questionName = 'householdData';

  const redirectToConfirmationPage = useShouldRedirectToConfirmation();
  const currentStepId = useStepNumber(questionName);

  // NAVIGATION
  const { navigateBack, navigateNext } = useHouseholdMembersNavigation({
    uuid,
    whiteLabel,
    currentStepId,
    pageNumber,
    redirectToConfirmationPage: redirectToConfirmationPage ?? false,
  });

  // FORM SETUP - branch schema and defaults by workflow type
  // The two workflows have fundamentally different schemas (different conditions, birth field types, etc).
  // We use `any` for the form type parameter since Zod handles runtime validation via zodResolver,
  // and cast to specific types when passing to typed section components.
  const formSchema = isEnergyCalculator
    ? createEnergyCalculatorHouseholdMemberSchema(intl, pageNumber, relationshipOptions)
    : createHouseholdMemberSchema(intl, pageNumber);

  const defaultValues = isEnergyCalculator
    ? createEnergyCalculatorDefaultValues(householdMemberFormData, pageNumber)
    : createDefaultValues(householdMemberFormData, pageNumber === 1);

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
    getValues,
    clearErrors,
    reset,
  } = useStepForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
    questionName,
    // Provide empty override to prevent automatic navigation - we'll navigate manually in formSubmitHandler
    onSubmitSuccessfulOverride: () => {},
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'incomeStreams',
  });

  // AGE CALCULATION
  const { calculateCurrentAgeStatus } = useAgeCalculation(watch);

  const watchHasIncome = useWatch({ control, name: 'hasIncome' });
  const watchBirthMonth = useWatch({ control, name: 'birthMonth' });
  const watchBirthYear = useWatch({ control, name: 'birthYear' });
  const watchIsStudent = useWatch({ control, name: 'conditions.student' });
  const watchIsDisabled = useWatch({ control, name: 'conditions.disabled' });

  // EFFECTS
  useHouseholdMemberFormEffects({
    isEnergyCalculator,
    questionName,
    pageNumber,
    defaultValues,
    setValue,
    getValues,
    reset,
    append,
    replace,
    calculateCurrentAgeStatus,
    watchHasIncome,
    watchBirthMonth,
    watchBirthYear,
    watchIsStudent,
    watchIsDisabled,
  });

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const formSubmitHandler: SubmitHandler<any> = async (memberData) => {
    if (!uuid) {
      throw new Error('uuid is undefined');
    }
    if (currentMemberIndex < 0 || currentMemberIndex > formData.householdData.length) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const updatedHouseholdData = [...formData.householdData];
    updatedHouseholdData[currentMemberIndex] = createHouseholdMemberData({
      memberData,
      currentMemberIndex,
      existingHouseholdData: formData.householdData,
      workflowType,
    });

    const updatedFormData = { ...formData, householdData: updatedHouseholdData };

    // Wait for the API call to complete and context to update before navigating
    await updateScreen(updatedFormData);

    // Now navigate after data is saved
    navigateNext();
  };

  const handleFormError = (formErrors: typeof errors) => {
    scrollToFirstError(formErrors, workflowType);
  };

  // HEADER DISPLAY
  const age = calculateAge(householdMemberFormData?.birthYear, householdMemberFormData?.birthMonth);
  const relationship = householdMemberFormData?.relationshipToHH;
  const relationshipText = relationship && relationshipOptions?.[relationship];

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderSummaryCards = () => (
    <section aria-label="Your household members" className="previous-members-section">
      <h2 className="question-label">
        <FormattedMessage id="householdDataBlock.yourHousehold" defaultMessage="Household Members" />
      </h2>
      <p className="question-sub-label">
        <FormattedMessage id="householdDataBlock.clickToEdit" defaultMessage="You may edit or delete completed members below." />
      </p>
      <Box className="summary-cards-container">
        <HouseholdMemberSummaryCards questionName={questionName} />
      </Box>
    </section>
  );

  const renderHeader = () => {
    let headerContent;
    if (pageNumber === 1) {
      headerContent = <FormattedMessage id="householdDataBlock.questionHeader" defaultMessage="Tell us about yourself." />;
    } else if (relationshipText) {
      headerContent = age !== null ? (
        <FormattedMessage
          id="householdDataBlock.questionHeader-relationship-age"
          defaultMessage="Tell us about your {relationship}, age {age}"
          values={{ relationship: <span style={{ textTransform: 'lowercase' }}>{relationshipText}</span>, age }}
        />
      ) : (
        <FormattedMessage
          id="householdDataBlock.questionHeader-relationship"
          defaultMessage="Tell us about your {relationship}"
          values={{ relationship: <span style={{ textTransform: 'lowercase' }}>{relationshipText}</span> }}
        />
      );
    } else {
      headerContent = (
        <FormattedMessage
          id="questions.householdData"
          defaultMessage="Tell us about the next person in your household."
        />
      );
    }

    return <QuestionHeader>{headerContent}</QuestionHeader>;
  };

  const renderFormSections = () => (
    <>
      {showBasicInfoSection && (
        <BasicInfoSection
          control={control as any}
          errors={errors}
          isFirstMember={pageNumber === 1}
          relationshipOptions={relationshipOptions}
        />
      )}

      {!isEnergyCalculator && (
        <HealthInsuranceSection
          errors={errors}
          healthInsurance={watch('healthInsurance')}
          setValue={setValue}
          clearErrors={clearErrors}
          options={healthInsuranceOptions}
          pageNumber={pageNumber}
        />
      )}

      <SpecialConditionsSection
        control={control as any}
        errors={errors}
        conditions={watch('conditions')}
        setValue={setValue as any}
        clearErrors={clearErrors}
        options={conditionOptions}
        pageNumber={pageNumber}
        showReceivesSsi={isEnergyCalculator}
      />

      {!isEnergyCalculator && watchIsStudent && (
        <StudentEligibilitySection
          control={control as any}
          errors={errors}
          pageNumber={pageNumber}
        />
      )}

      <IncomeSection
        control={control as any}
        errors={errors}
        fields={fields as any}
        append={append}
        remove={remove}
        watch={watch as any}
        incomeOptions={incomeOptions}
        frequencyMenuItems={frequencyMenuItems}
        pageNumber={pageNumber}
        isUnder16={calculateCurrentAgeStatus().isUnder16}
      />
    </>
  );

  // Show summary cards only when on member 2+
  const showSummaryCards = pageNumber > 1;

  return (
    <main key={pageNumber} className="benefits-form">
      {showSummaryCards && renderSummaryCards()}

      {renderHeader()}

      <form
        key={`household-member-${pageNumber}`}
        onSubmit={handleSubmit(formSubmitHandler, handleFormError)}
      >
        {renderFormSections()}
        <PrevAndContinueButtons backNavigationFunction={navigateBack} />
      </form>
    </main>
  );
};

export default HouseholdMemberForm;
