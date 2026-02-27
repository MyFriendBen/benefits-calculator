import { FormattedMessage, useIntl } from 'react-intl';
import { Box, FormControl, InputLabel, Select, TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { Control, Controller, FieldErrors, FieldValues, Path } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { BASIC_INFO_GRID_STYLES } from '../utils/constants';
import '../styles/HouseholdMemberSections.css';

// BasicInfoSection is generic over T so it can be embedded in single-member forms
// (T = HouseholdMemberFormSchema) or in array-based forms (T = some outer schema).
interface BasicInfoSectionProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  fieldPrefix?: string; // e.g., "members.0" or "" for root level
  isFirstMember?: boolean; // Whether this is the head of household
  relationshipOptions: Record<string, FormattedMessageType>;
  showSectionHeader?: boolean; // Whether to show the "Basic Information" header
}

/**
 * Reusable component for birth month, birth year, and relationship fields
 * Can be used standalone (in HouseholdMemberForm) or as part of an array (in HouseholdMemberBasicInfoPage)
 */
function BasicInfoSection<T extends FieldValues>({
  control,
  errors,
  fieldPrefix = '',
  isFirstMember = false,
  relationshipOptions,
  showSectionHeader = true,
}: BasicInfoSectionProps<T>) {
  const intl = useIntl();

  // Build inside component so FormattedMessage-style translations resolve via IntlProvider context
  const months: Record<number, string> = {
    1: intl.formatMessage({ id: 'ageInput.months.january', defaultMessage: 'January' }),
    2: intl.formatMessage({ id: 'ageInput.months.february', defaultMessage: 'February' }),
    3: intl.formatMessage({ id: 'ageInput.months.march', defaultMessage: 'March' }),
    4: intl.formatMessage({ id: 'ageInput.months.april', defaultMessage: 'April' }),
    5: intl.formatMessage({ id: 'ageInput.months.may', defaultMessage: 'May' }),
    6: intl.formatMessage({ id: 'ageInput.months.june', defaultMessage: 'June' }),
    7: intl.formatMessage({ id: 'ageInput.months.july', defaultMessage: 'July' }),
    8: intl.formatMessage({ id: 'ageInput.months.august', defaultMessage: 'August' }),
    9: intl.formatMessage({ id: 'ageInput.months.september', defaultMessage: 'September' }),
    10: intl.formatMessage({ id: 'ageInput.months.october', defaultMessage: 'October' }),
    11: intl.formatMessage({ id: 'ageInput.months.november', defaultMessage: 'November' }),
    12: intl.formatMessage({ id: 'ageInput.months.december', defaultMessage: 'December' }),
  };

  const monthMenuItems = createMenuItems(
    months,
    <FormattedMessage id="ageInput.selectMonth" defaultMessage="Select Month" />
  );

  // Helper to get nested error
  const getError = (fieldName: string) => {
    if (!fieldPrefix) return errors[fieldName];
    const parts = fieldPrefix.split('.');
    let error = errors as Record<string, any>;
    for (const part of parts) {
      error = error?.[part];
    }
    return error?.[fieldName];
  };

  // Helper to construct field name; cast is safe because the caller controls both prefix and fieldName
  const getFieldName = (fieldName: string): Path<T> => {
    return (fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName) as Path<T>;
  };

  const birthMonthError = getError('birthMonth');
  const birthYearError = getError('birthYear');
  const relationshipError = getError('relationshipToHH');

  const fieldsContent = (
    <>
      {/* Birth Month */}
      <FormControl fullWidth error={!!birthMonthError}>
        <InputLabel>
          <FormattedMessage id="ageInput.birthMonth" defaultMessage="Birth Month" />
        </InputLabel>
        <Controller
          name={getFieldName('birthMonth')}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Birth Month"
              value={field.value || ''}
              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
              displayEmpty
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
          name={getFieldName('birthYear')}
          control={control}
          render={({ field }) => (
            <NumericFormat
              value={field.value || ''}
              onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
              onBlur={field.onBlur}
              getInputRef={field.ref}
              allowNegative={false}
              decimalScale={0}
              customInput={TextField}
              label={<FormattedMessage id="ageInput.birthYear" defaultMessage="Birth Year" />}
              placeholder="YYYY"
              variant="outlined"
              inputProps={{ inputMode: 'numeric' }}
            />
          )}
        />
        {birthYearError && (
          <ErrorMessageWrapper fontSize="0.75rem">
            {birthYearError.message as string}
          </ErrorMessageWrapper>
        )}
      </FormControl>

      {/* Relationship */}
      {!isFirstMember && (
        <FormControl fullWidth error={!!relationshipError}>
          <InputLabel>
            <FormattedMessage
              id="householdDataBlock.relationshipToYou"
              defaultMessage="Relationship to you"
            />
          </InputLabel>
          <Controller
            name={getFieldName('relationshipToHH')}
            control={control}
            render={({ field }) => (
              <Select {...field} label="Relationship to you">
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

  // If no section header, just return the fields
  if (!showSectionHeader) {
    return <>{fieldsContent}</>;
  }

  // With section header (for HouseholdMemberForm)
  return (
    <Box id="basic-info-section" className="section">
      <QuestionQuestion>
        <FormattedMessage id="householdDataBlock.basicInfo" defaultMessage="Basic Information" />
      </QuestionQuestion>
      <Box sx={BASIC_INFO_GRID_STYLES}>
        {fieldsContent}
      </Box>
    </Box>
  );
}

export default BasicInfoSection;
