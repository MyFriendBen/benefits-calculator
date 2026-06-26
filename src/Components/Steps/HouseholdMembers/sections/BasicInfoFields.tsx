import { FormattedMessage } from 'react-intl';
import { FormControl, InputLabel, Select, TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { Control, Controller, FieldError } from 'react-hook-form';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { useMonthMenuItems } from '../utils/constants';

interface BasicInfoFieldsProps {
  control: Control<any>;
  namePrefix?: string;
  birthMonthError?: FieldError;
  birthYearError?: FieldError;
  relationshipError?: FieldError;
  isFirstMember?: boolean;
  relationshipOptions: Record<string, FormattedMessageType>;
}

/**
 * Renders the three basic info fields (birth month, birth year, relationship)
 * for a single household member. Used by both BasicInfoSection (single-member form)
 * and HouseholdMemberBasicInfoPage (multi-member form via namePrefix).
 */
const BasicInfoFields = ({
  control,
  namePrefix = '',
  birthMonthError,
  birthYearError,
  relationshipError,
  isFirstMember = false,
  relationshipOptions,
}: BasicInfoFieldsProps) => {
  const monthMenuItems = useMonthMenuItems();
  const prefix = namePrefix ? `${namePrefix}.` : '';
  // Derive a DOM-safe label suffix from the namePrefix (e.g. "members.0" → "-members-0")
  const labelSuffix = namePrefix ? `-${namePrefix.replace(/\./g, '-')}` : '';

  return (
    <>
      {/* Birth Month */}
      <FormControl fullWidth error={!!birthMonthError}>
        <InputLabel id={`birth-month-label${labelSuffix}`}>
          <FormattedMessage id="ageInput.birthMonth" defaultMessage="Birth Month" />
        </InputLabel>
        <Controller
          name={`${prefix}birthMonth`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              labelId={`birth-month-label${labelSuffix}`}
              label="Birth Month"
              value={field.value || ''}
              onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
            >
              {monthMenuItems}
            </Select>
          )}
        />
        {birthMonthError && (
          <ErrorMessageWrapper fontSize="0.75rem">
            {birthMonthError.message as string}
          </ErrorMessageWrapper>
        )}
      </FormControl>

      {/* Birth Year */}
      <FormControl fullWidth error={!!birthYearError}>
        <Controller
          name={`${prefix}birthYear`}
          control={control}
          render={({ field }) => (
            <NumericFormat
              value={field.value || ''}
              onValueChange={({ floatValue }) => field.onChange(floatValue)}
              onBlur={field.onBlur}
              getInputRef={field.ref}
              allowNegative={false}
              decimalScale={0}
              customInput={TextField}
              label={<FormattedMessage id="ageInput.birthYear" defaultMessage="Birth Year" />}
              placeholder="YYYY"
              variant="outlined"
              inputProps={{ inputMode: 'numeric' }}
              error={!!birthYearError}
            />
          )}
        />
        {birthYearError && (
          <ErrorMessageWrapper fontSize="0.75rem">
            {birthYearError.message as string}
          </ErrorMessageWrapper>
        )}
      </FormControl>

      {/* Relationship — hidden for primary member, editable for others */}
      {!isFirstMember && (
        <FormControl fullWidth error={!!relationshipError}>
          <InputLabel id={`relationship-label${labelSuffix}`}>
            <FormattedMessage
              id="householdDataBlock.relationshipToYou"
              defaultMessage="Relationship to you"
            />
          </InputLabel>
          <Controller
            name={`${prefix}relationshipToHH`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id={`relationship-select${labelSuffix}`}
                labelId={`relationship-label${labelSuffix}`}
                label="Relationship to you"
                displayEmpty
              >
                {createMenuItems(
                  relationshipOptions,
                  <FormattedMessage
                    id="householdDataBlock.selectRelationship"
                    defaultMessage="Select relationship"
                  />
                )}
              </Select>
            )}
          />
          {relationshipError && (
            <ErrorMessageWrapper fontSize="0.75rem">
              {relationshipError.message as string}
            </ErrorMessageWrapper>
          )}
        </FormControl>
      )}
    </>
  );
};

export default BasicInfoFields;
