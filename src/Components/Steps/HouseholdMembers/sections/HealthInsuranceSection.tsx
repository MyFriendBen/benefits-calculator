import { FormattedMessage } from 'react-intl';
import { Stack, FormHelperText } from '@mui/material';
import { Control, UseFormSetValue, UseFormTrigger, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import RHFOptionCardGroup from '../../../RHFComponents/RHFOptionCardGroup';
import { HealthInsurance } from '../../../../Types/FormData';
import { HealthInsuranceOptions } from '../utils/types';
import '../styles/HouseholdMemberSections.css';

interface HealthInsuranceSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  healthInsurance: HealthInsurance;
  setValue: UseFormSetValue<any>;
  trigger: UseFormTrigger<any>;
  clearErrors: UseFormClearErrors<any>;
  options: HealthInsuranceOptions;
  pageNumber: number;
}

const HealthInsuranceSection = ({
  errors,
  healthInsurance,
  setValue,
  trigger,
  clearErrors,
  options,
  pageNumber,
}: HealthInsuranceSectionProps) => {
  return (
    <div id="health-insurance-section" className="section-container">
      <Stack className="section">
        <QuestionQuestion>
          <FormattedMessage id="questions.healthInsurance" defaultMessage="Health Insurance" />
        </QuestionQuestion>
        <QuestionDescription>
          <FormattedMessage id="insurance.chooseAllThatApply" defaultMessage="Choose all that apply." />
        </QuestionDescription>
        {errors.healthInsurance && (
          <FormHelperText sx={{ ml: 0, mb: 1 }}>
            <ErrorMessageWrapper fontSize="var(--error-message-font-size)">{errors.healthInsurance.message as string}</ErrorMessageWrapper>
          </FormHelperText>
        )}
        <RHFOptionCardGroup
          fields={healthInsurance}
          setValue={setValue}
          name="healthInsurance"
          options={pageNumber === 1 ? options.you : options.them}
          triggerValidation={trigger}
          clearErrors={clearErrors}
        />
      </Stack>
    </div>
  );
};

export default HealthInsuranceSection;
