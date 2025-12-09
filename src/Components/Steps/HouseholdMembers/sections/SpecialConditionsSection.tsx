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

interface SpecialConditionsSectionProps {
  errors: FieldErrors<any>;
  specialConditions: Conditions;
  setValue: UseFormSetValue<any>;
  clearErrors: UseFormClearErrors<any>;
  options: ConditionOptions;
  pageNumber: number;
}

const SpecialConditionsSection = ({
  errors,
  specialConditions,
  setValue,
  clearErrors,
  options,
  pageNumber,
}: SpecialConditionsSectionProps) => {
  const noneOption = {
    none: {
      icon: <NoneIcon className="option-card-icon" />,
      text:
        pageNumber === 1 ? (
          <FormattedMessage
            id="conditions.none"
            defaultMessage="I don't have any of these circumstances"
          />
        ) : (
          <FormattedMessage
            id="conditions.none-they"
            defaultMessage="They don't have any of these circumstances"
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
          id="questions.chooseAllThatApply"
          defaultMessage="Choose all that apply"
        />
      </QuestionDescription>
      {errors.specialConditions && (
        <FormHelperText sx={{ ml: 0, mb: 1 }}>
          <ErrorMessageWrapper fontSize="var(--error-message-font-size)">{errors.specialConditions.message as string}</ErrorMessageWrapper>
        </FormHelperText>
      )}
      <RHFOptionCardGroup
        fields={specialConditions}
        setValue={setValue}
        name="specialConditions"
        options={conditionsWithNone}
        clearErrors={clearErrors}
      />
    </Box>
  );
};

export default SpecialConditionsSection;
