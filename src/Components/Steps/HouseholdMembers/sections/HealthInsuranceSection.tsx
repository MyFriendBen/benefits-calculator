import { FormattedMessage } from 'react-intl';
import { Stack, FormHelperText } from '@mui/material';
import { UseFormSetValue, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../../../SelectTiles/MultiSelectTiles';
import { HealthInsurance } from '../../../../Types/FormData';
import { HealthInsuranceOptions } from '../utils/types';
import '../styles/HouseholdMemberSections.css';

interface HealthInsuranceSectionProps {
  errors: FieldErrors<any>;
  healthInsurance: HealthInsurance;
  setValue: UseFormSetValue<any>;
  clearErrors: UseFormClearErrors<any>;
  options: HealthInsuranceOptions;
  pageNumber: number;
}

const HealthInsuranceSection = ({
  errors,
  healthInsurance,
  setValue,
  clearErrors,
  options,
  pageNumber,
}: HealthInsuranceSectionProps) => {
  const insuranceSource = pageNumber === 1 ? options.you : options.them;
  const insuranceTileOptions = Object.entries(insuranceSource).map(([key, option]) => ({
    value: key,
    text: option.text,
    icon: option.icon,
  }));

  return (
    <div id="health-insurance-section" className="section-container">
      <Stack className="section">
        <QuestionQuestion>
          {pageNumber === 1 ? (
            <FormattedMessage
              id="questions.healthInsurance-you"
              defaultMessage="Which type of health insurance do you have?"
            />
          ) : (
            <FormattedMessage
              id="questions.healthInsurance-they"
              defaultMessage="What type of health insurance do they have?"
            />
          )}
        </QuestionQuestion>
        <QuestionDescription>
          <FormattedMessage id="insurance.chooseAllThatApply" defaultMessage="Choose all that apply." />
        </QuestionDescription>
        {errors.healthInsurance && (
          <FormHelperText sx={{ ml: 0, mb: 1 }}>
            <ErrorMessageWrapper fontSize="var(--error-message-font-size)">{errors.healthInsurance.message as string}</ErrorMessageWrapper>
          </FormHelperText>
        )}
        <MultiSelectTiles
          variant="square"
          exclusiveValues={['none']}
          options={insuranceTileOptions}
          values={healthInsurance}
          onChange={(values) => {
            setValue('healthInsurance', values as HealthInsurance, { shouldValidate: false, shouldDirty: true });
            clearErrors('healthInsurance');
          }}
        />
      </Stack>
    </div>
  );
};

export default HealthInsuranceSection;
