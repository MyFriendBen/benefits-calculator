import { FormattedMessage } from 'react-intl';
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import QuestionQuestion from '../../../QuestionComponents/QuestionQuestion';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { FormattedMessageType } from '../../../../Types/Questions';
import { MONTHS } from '../utils/data';
import { YEARS } from '../../../../Assets/age';
import { SECTION_STYLES, BASIC_INFO_GRID_STYLES } from '../utils/constants';

interface BasicInfoSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  pageNumber: number;
  relationshipOptions: Record<string, FormattedMessageType>;
}

const BasicInfoSection = ({
  control,
  errors,
  pageNumber,
  relationshipOptions,
}: BasicInfoSectionProps) => {
  const monthMenuItems = createMenuItems(
    MONTHS,
    <FormattedMessage id="ageInput.selectMonth" defaultMessage="Select Month" />
  );

  const yearMenuItems = createMenuItems(
    YEARS.reduce((acc, year) => {
      acc[String(year)] = String(year);
      return acc;
    }, {} as Record<string, string>),
    <FormattedMessage id="ageInput.selectYear" defaultMessage="Select Year" />
  );

  return (
    <Box sx={SECTION_STYLES}>
      <QuestionQuestion>
        <FormattedMessage id="householdDataBlock.basicInfo" defaultMessage="Basic Information" />
      </QuestionQuestion>
      <Box sx={BASIC_INFO_GRID_STYLES}>
        {/* Birth Month */}
        <FormControl fullWidth error={errors.birthMonth !== undefined}>
          <InputLabel>
            <FormattedMessage id="ageInput.birthMonth" defaultMessage="Birth Month" />
          </InputLabel>
          <Controller
            name="birthMonth"
            control={control}
            render={({ field }) => (
              <Select {...field} label="Birth Month">
                {monthMenuItems}
              </Select>
            )}
          />
          {errors.birthMonth && (
            <FormHelperText>
              <ErrorMessageWrapper fontSize="0.75rem">
                {errors.birthMonth.message as string}
              </ErrorMessageWrapper>
            </FormHelperText>
          )}
        </FormControl>

        {/* Birth Year */}
        <FormControl fullWidth error={errors.birthYear !== undefined}>
          <Controller
            name="birthYear"
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
          {errors.birthYear && (
            <FormHelperText>
              <ErrorMessageWrapper fontSize="0.75rem">
                {errors.birthYear.message as string}
              </ErrorMessageWrapper>
            </FormHelperText>
          )}
        </FormControl>

        {/* Relationship */}
        <FormControl fullWidth error={errors.relationshipToHH !== undefined}>
          <InputLabel>
            <FormattedMessage
              id="householdDataBlock.relationshipToYou"
              defaultMessage="Relationship to you"
            />
          </InputLabel>
          <Controller
            name="relationshipToHH"
            control={control}
            render={({ field }) => (
              <Select {...field} label="Relationship to you" disabled={pageNumber === 1}>
                {pageNumber === 1 ? (
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
          {errors.relationshipToHH && (
            <FormHelperText>
              <ErrorMessageWrapper fontSize="0.75rem">
                {errors.relationshipToHH.message as string}
              </ErrorMessageWrapper>
            </FormHelperText>
          )}
        </FormControl>
      </Box>
    </Box>
  );
};

export default BasicInfoSection;
