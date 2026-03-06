import { FormattedMessage, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { BASIC_INFO_GRID_STYLES } from '../utils/constants';
import { HouseholdMemberFormSchema } from '../utils/schema';
import '../styles/HouseholdMemberSections.css';

interface BasicInfoSectionProps {
  control: Control<HouseholdMemberFormSchema>;
  errors: FieldErrors<HouseholdMemberFormSchema>;
  isFirstMember?: boolean;
  relationshipOptions: Record<string, FormattedMessageType>;
  showSectionHeader?: boolean;
}

const BasicInfoSection = ({
  control,
  errors,
  isFirstMember = false,
  relationshipOptions,
  showSectionHeader = true,
}: BasicInfoSectionProps) => {
  const intl = useIntl();

  // Memoized so the object and menu items are not rebuilt on every render.
  // The locale is the only dependency — rebuilds only when language changes.
  const monthMenuItems = useMemo(() => {
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
    return Object.entries(months).map(([key, label]) => (
      <MenuItem value={Number(key)} key={key}>{label}</MenuItem>
    ));
  }, [intl]);

  const birthMonthError = errors.birthMonth;
  const birthYearError = errors.birthYear;
  const relationshipError = errors.relationshipToHH;

  const fieldsContent = (
    <>
      {/* Birth Month */}
      <FormControl fullWidth error={!!birthMonthError}>
        <InputLabel id="birth-month-label">
          <FormattedMessage id="ageInput.birthMonth" defaultMessage="Birth Month" />
        </InputLabel>
        <Controller
          name="birthMonth"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              labelId="birth-month-label"
              label="Birth Month"
              value={field.value || ''}
              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
            >
              {monthMenuItems}
            </Select>
          )}
        />
        {birthMonthError && (
          <ErrorMessageWrapper>
            {birthMonthError.message as string}
          </ErrorMessageWrapper>
        )}
      </FormControl>

      {/* Birth Year */}
      <FormControl fullWidth error={!!birthYearError}>
        <Controller
          name="birthYear"
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
              error={!!birthYearError}
            />
          )}
        />
        {birthYearError && (
          <ErrorMessageWrapper>
            {birthYearError.message as string}
          </ErrorMessageWrapper>
        )}
      </FormControl>

      {/* Relationship */}
      {!isFirstMember && (
        <FormControl fullWidth error={!!relationshipError}>
          <InputLabel id="relationship-to-hh-label">
            <FormattedMessage
              id="householdDataBlock.relationshipToYou"
              defaultMessage="Relationship to you"
            />
          </InputLabel>
          <Controller
            name="relationshipToHH"
            control={control}
            render={({ field }) => (
              <Select {...field} id="relationship-to-hh-select" labelId="relationship-to-hh-label" label="Relationship to you" displayEmpty>
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
            <ErrorMessageWrapper>
              {relationshipError.message as string}
            </ErrorMessageWrapper>
          )}
        </FormControl>
      )}
    </>
  );

  return (
    <Box id="basic-info-section" className="section">
      {showSectionHeader && (
        <QuestionQuestion>
          <FormattedMessage id="householdDataBlock.basicInfo" defaultMessage="Basic Information" />
        </QuestionQuestion>
      )}
      <Box sx={BASIC_INFO_GRID_STYLES}>
        {fieldsContent}
      </Box>
    </Box>
  );
};

export default BasicInfoSection;
