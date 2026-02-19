import { FormattedMessage } from 'react-intl';
import { Box, FormHelperText } from '@mui/material';
import { UseFormSetValue, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../../../SelectTiles/MultiSelectTiles';
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
  const conditionSource = pageNumber === 1 ? options.you : options.them;
  const conditionTileOptions = Object.entries(conditionSource).map(([key, option]) => ({
    value: key,
    text: option.text,
    icon: option.icon,
  }));

  return (
    <Box id="conditions-section" className="section">
      <QuestionQuestion>
        {pageNumber === 1 ? (
          <FormattedMessage
            id="householdDataBlock.createConditionsQuestion-do-these-apply-to-you"
            defaultMessage="Do any of these apply to you?"
          />
        ) : (
          <FormattedMessage
            id="householdDataBlock.createConditionsQuestion-do-these-apply"
            defaultMessage="Do any of these apply to them?"
          />
        )}
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="householdDataBlock.createConditionsQuestion-pick"
          defaultMessage="Choose all that apply. If none apply, skip this question."
        />
      </QuestionDescription>
      {errors.conditions && (
        <FormHelperText sx={{ ml: 0, mb: 1 }}>
          <ErrorMessageWrapper fontSize="var(--error-message-font-size)">{errors.conditions.message as string}</ErrorMessageWrapper>
        </FormHelperText>
      )}
      <MultiSelectTiles
        variant="square"
        options={conditionTileOptions}
        values={specialConditions}
        onChange={(values) => {
          setValue('conditions', values as Conditions, { shouldDirty: true });
          clearErrors('conditions');
        }}
      />
    </Box>
  );
};

export default SpecialConditionsSection;
