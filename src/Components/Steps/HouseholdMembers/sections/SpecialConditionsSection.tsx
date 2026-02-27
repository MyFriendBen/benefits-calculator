import { FormattedMessage, useIntl } from 'react-intl';
import { Box, FormControlLabel, FormHelperText, Radio, RadioGroup } from '@mui/material';
import { Control, Controller, UseFormSetValue, UseFormClearErrors, UseFormGetValues, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../../QuestionComponents/QuestionDescription';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import MultiSelectTiles from '../../../SelectTiles/MultiSelectTiles';
import { ConditionOptions } from '../utils/types';
import '../styles/HouseholdMemberSections.css';

// Shared between main and EC workflows. The condition tiles shown are determined
// by the `options` prop (which comes from config), so this component doesn't need
// to know which workflow it's in for tile rendering.
interface SpecialConditionsSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  conditions: Record<string, boolean>;
  setValue: UseFormSetValue<any>;
  clearErrors: UseFormClearErrors<any>;
  getValues: UseFormGetValues<any>;
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
  getValues,
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
        values={conditions}
        onChange={(values) => {
          setValue('conditions', values, { shouldValidate: true, shouldDirty: true });
          clearErrors('conditions');
        }}
      />

      {/* SSI question - shown for EC workflow when disabled is selected */}
      {showReceivesSsi && getValues('conditions.disabled') && (
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
