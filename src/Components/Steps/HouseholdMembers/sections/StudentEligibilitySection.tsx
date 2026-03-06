import { FormattedMessage, useIntl } from 'react-intl';
import { Box, FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from '@mui/material';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { HouseholdMemberFormSchema } from '../utils/schema';
import { STUDENT_QUESTIONS } from '../utils/schema';
import '../styles/HouseholdMemberSections.css';

interface StudentEligibilitySectionProps {
  control: Control<HouseholdMemberFormSchema>;
  errors: FieldErrors<HouseholdMemberFormSchema>;
  pageNumber: number;
}

const StudentEligibilitySection = ({ control, errors, pageNumber }: StudentEligibilitySectionProps) => {
  const intl = useIntl();
  const subject = pageNumber === 1 ? 'you' : 'they';

  return (
    <Box id="student-eligibility-section" className="section" sx={{ mt: 2, pl: 2, borderLeft: '3px solid #e0e0e0' }}>
      <Box component="h4" sx={{ fontWeight: 700, mb: 2, mt: 0, fontSize: '1.13rem', color: 'text.primary' }}>
        <FormattedMessage id="studentEligibility.sectionTitle" defaultMessage="Student Information" />
      </Box>
      {STUDENT_QUESTIONS.map(({ name, messageId, defaultMessage, ariaLabelId, ariaLabelDefault }) => (
        <Box key={name} sx={{ pb: '1.5rem' }}>
          <Controller
            name={`studentEligibility.${name}`}
            control={control}
            render={({ field }) => (
              <FormControl component="fieldset" error={!!errors.studentEligibility?.[name]}>
                <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
                  <FormattedMessage
                    id={messageId}
                    defaultMessage={defaultMessage}
                    values={{ subject }}
                  />
                </FormLabel>
                <RadioGroup
                  {...field}
                  value={field.value === undefined ? '' : field.value ? 'true' : 'false'}
                  onChange={(e) => field.onChange(e.target.value === 'true')}
                  aria-label={intl.formatMessage({ id: ariaLabelId, defaultMessage: ariaLabelDefault })}
                >
                  <FormControlLabel
                    value="true"
                    control={<Radio size="small" />}
                    label={<FormattedMessage id="radiofield.label-yes" defaultMessage="Yes" />}
                  />
                  <FormControlLabel
                    value="false"
                    control={<Radio size="small" />}
                    label={<FormattedMessage id="radiofield.label-no" defaultMessage="No" />}
                  />
                </RadioGroup>
                {errors.studentEligibility?.[name] && (
                  <FormHelperText sx={{ ml: 0 }}>
                    <ErrorMessageWrapper>
                      {errors.studentEligibility[name]?.message}
                    </ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Box>
      ))}
    </Box>
  );
};

export default StudentEligibilitySection;
