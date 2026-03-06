import { FormattedMessage, useIntl } from 'react-intl';
import { Box, FormControlLabel, FormHelperText, Radio, RadioGroup } from '@mui/material';
import { Control, Controller, UseFormSetValue, UseFormClearErrors, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../../../SelectTiles/MultiSelectTiles';
import { ConditionOptions } from '../utils/types';
import '../styles/HouseholdMemberSections.css';

// Minimal shape that covers both the main and EC conditions objects.
// The tile options shown are driven by the `options` config prop, so both
// workflows can use this same component.
type ConditionsFormValues = {
  conditions: Record<string, boolean>;
  receivesSsi?: string;
};

interface SpecialConditionsSectionProps {
  control: Control<ConditionsFormValues>;
  errors: FieldErrors<ConditionsFormValues>;
  conditions: Record<string, boolean>;
  setValue: UseFormSetValue<ConditionsFormValues>;
  clearErrors: UseFormClearErrors<ConditionsFormValues>;
  options: ConditionOptions;
  pageNumber: number;
  showReceivesSsi?: boolean;
}

const SpecialConditionsSection = ({
  control,
  errors,
  conditions,
  setValue,
  clearErrors,
  options,
  pageNumber,
  showReceivesSsi = false,
}: SpecialConditionsSectionProps) => {
  const intl = useIntl();
  const conditionSource = pageNumber === 1 ? options.you : options.them;
  const conditionTileOptions = Object.entries(conditionSource).map(([key, option]) => ({
    value: key,
    text: option.text,
    icon: option.icon,
  }));

  return (
    <Box id="conditions-section" className="section">
      <QuestionQuestion>
        <FormattedMessage
          id="householdDataBlock.specialConditionsQuestion"
          defaultMessage="Special Circumstances"
        />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage
          id="householdDataBlock.createConditionsQuestion-pick"
          defaultMessage="Select all that apply. If none apply, skip this question."
        />
      </QuestionDescription>
      {errors.conditions && (
        <FormHelperText sx={{ ml: 0, mb: 1 }}>
          <ErrorMessageWrapper fontSize="var(--error-message-font-size)">
            {(errors.conditions as unknown as { message: string }).message}
          </ErrorMessageWrapper>
        </FormHelperText>
      )}
      <MultiSelectTiles
        variant="square"
        options={conditionTileOptions}
        values={conditions}
        onChange={(values) => {
          setValue('conditions', values as Record<string, boolean>, { shouldValidate: true, shouldDirty: true });
          clearErrors('conditions');
        }}
      />

      {/* SSI question - shown for EC workflow when disabled is selected */}
      {showReceivesSsi && conditions.disabled && (
        <Box sx={{ pb: '2rem', pt: '1rem' }}>
          <QuestionQuestion>
            <FormattedMessage
              id={pageNumber === 1 ? 'ecHHMF.you-receiveSsi' : 'ecHHMF.they-receiveSsi'}
              defaultMessage={
                pageNumber === 1
                  ? 'Based on this disability, did you receive full benefits from Social Security, SSI, the Department of Human Services, or a public or private plan?'
                  : 'Based on this disability, do they receive full benefits from Social Security, SSI, the Department of Human Services, or a public or private plan?'
              }
            />
          </QuestionQuestion>
          <Controller
            name="receivesSsi"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <RadioGroup
                {...field}
                aria-label={intl.formatMessage({
                  id: 'ecHHMF.createReceivesSsiQuestion-ariaLabel',
                  defaultMessage: 'has ssi',
                })}
                sx={{ marginBottom: '1rem' }}
              >
                <FormControlLabel
                  value="true"
                  control={<Radio />}
                  label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
                />
                <FormControlLabel
                  value="false"
                  control={<Radio />}
                  label={<FormattedMessage id="radiofield.label-no" defaultMessage="No" />}
                />
              </RadioGroup>
            )}
          />
        </Box>
      )}
    </Box>
  );
};

export default SpecialConditionsSection;
