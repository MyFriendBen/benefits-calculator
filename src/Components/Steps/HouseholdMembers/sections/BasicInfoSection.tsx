import { FormattedMessage } from 'react-intl';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { BASIC_INFO_GRID_STYLES, MONTHS } from '../utils/constants';
import '../styles/HouseholdMemberSections.css';

interface BasicInfoSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPrefix?: string; // e.g., "members.0" or "" for root level
  isFirstMember?: boolean; // Whether this is the head of household
  relationshipOptions: Record<string, FormattedMessageType>;
  showSectionHeader?: boolean; // Whether to show the "Basic Information" header
}

/**
 * Reusable component for birth month, birth year, and relationship fields
 * Can be used standalone (in HouseholdMemberForm) or as part of an array (in HouseholdMemberBasicInfoPage)
 */
const BasicInfoSection = ({
  control,
  errors,
  fieldPrefix = '',
  isFirstMember = false,
  relationshipOptions,
  showSectionHeader = true,
}: BasicInfoSectionProps) => {
  const monthMenuItems = createMenuItems(
    MONTHS,
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

  // Helper to construct field name
  const getFieldName = (fieldName: string) => {
    return fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
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
            <TextField
              {...field}
              label={<FormattedMessage id="ageInput.birthYear" defaultMessage="Birth Year" />}
              variant="outlined"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
            <Select {...field} label="Relationship to you" disabled={isFirstMember}>
              {isFirstMember ? (
                <MenuItem value="headOfHousehold">
                  <FormattedMessage id="relationship.self" defaultMessage="Self" />
                </MenuItem>
              ) : (
                createMenuItems(
                  relationshipOptions,
                  <FormattedMessage
                    id="householdDataBlock.selectRelationship"
                    defaultMessage="Select relationship"
                  />
                )
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
};

export default BasicInfoSection;
