import { FormattedMessage } from 'react-intl';
import { Box, FormHelperText } from '@mui/material';
import { UseFormSetValue, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import RHFOptionCardGroup from '../../../RHFComponents/RHFOptionCardGroup';
import { ReactComponent as NoneIcon } from '../../../../Assets/icons/General/OptionCard/HealthInsurance/none.svg';
import { Conditions } from '../../../../Types/FormData';
import { ConditionOptions } from '../utils/types';
import '../styles/HouseholdMemberSections.css';

interface ConditionsSectionProps {
  errors: FieldErrors;
  conditions: Conditions;
  setValue: UseFormSetValue<any>; // Keep as any for flexibility with dynamic field updates
  clearErrors: UseFormClearErrors<any>; // Keep as any for flexibility
  options: ConditionOptions;
  pageNumber: number;
}

const ConditionsSection = ({
  errors,
  conditions,
  setValue,
  clearErrors,
  options,
  pageNumber,
}: ConditionsSectionProps) => {
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
    ...(pageNumber === 1 ? options.you : options.them),
  };

  return (
    <Box id="conditions-section" className="section">
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
      {errors.conditions && (
        <FormHelperText sx={{ ml: 0, mb: 1 }}>
          <ErrorMessageWrapper fontSize="var(--error-message-font-size)">{errors.conditions.message as string}</ErrorMessageWrapper>
        </FormHelperText>
      )}
      <RHFOptionCardGroup
        fields={conditions}
        setValue={setValue}
        name="conditions"
        options={conditionsWithNone}
        clearErrors={clearErrors}
      />
    </Box>
  );
};

export default ConditionsSection;
