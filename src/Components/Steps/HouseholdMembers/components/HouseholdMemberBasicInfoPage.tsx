import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, useFieldArray, SubmitHandler } from 'react-hook-form';
import { Box, TextField, FormControl, Select, MenuItem, Typography, InputLabel } from '@mui/material';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../../Wrapper/Wrapper';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import useScreenApi from '../../../../Assets/updateScreen';
import useStepForm from '../../stepForm';
import ErrorMessageWrapper from '../../../ErrorMessage/ErrorMessageWrapper';
import { FormattedMessageType } from '../../../../Types/Questions';
import { useConfig } from '../../../Config/configHook';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';
import { getCurrentMonthYear, YEARS, MAX_AGE } from '../../../../Assets/age';
import { MONTHS } from '../utils/data';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { ReactComponent as PersonIcon } from '../../../../Assets/icons/General/head.svg';

const HouseholdMemberBasicInfoPage = () => {
  const { formData } = useContext(Context);
  const { uuid, whiteLabel } = useParams();
  const navigate = useNavigate();
  const intl = useIntl();
  const { updateScreen } = useScreenApi();
  const currentStepId = useStepNumber('householdData');

  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');
  const { CURRENT_MONTH, CURRENT_YEAR } = getCurrentMonthYear();

  const backNavigationFunction = () => {
    if (!uuid) {
      console.error('UUID is undefined');
      return;
    }
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId - 1}`);
  };

  // Create zod schema for validation
  const memberSchema = z.object({
    birthMonth: z.string().min(1, {
      message: intl.formatMessage({
        id: 'ageInput.month.error',
        defaultMessage: 'Please enter a birth month.',
      }),
    }),
    birthYear: z
      .string()
      .trim()
      .min(1, {
        message: intl.formatMessage({
          id: 'ageInput.year.error',
          defaultMessage: 'Please enter a birth year.',
        }),
      })
      .refine((value) => {
        const year = Number(value);
        const age = CURRENT_YEAR - year;
        return year <= CURRENT_YEAR && age < MAX_AGE;
      }),
    relationshipToHH: z.string().min(1, {
      message: intl.formatMessage({
        id: 'errorMessage-HHMemberRelationship',
        defaultMessage: 'Please select a relationship.',
      }),
    }),
  }).refine(
    ({ birthMonth, birthYear }) => {
      if (Number(birthYear) === CURRENT_YEAR) {
        return Number(birthMonth) <= CURRENT_MONTH;
      }
      return true;
    },
    {
      message: intl.formatMessage({
        id: 'hhmform.invalidBirthMonth',
        defaultMessage: 'This birth month is in the future',
      }),
      path: ['birthMonth'],
    }
  );

  const formSchema = z.object({
    members: z.array(memberSchema),
  });

  type FormSchema = z.infer<typeof formSchema>;

  // Initialize default values for all household members
  const defaultMembers = Array.from({ length: formData.householdSize }, (_, index) => {
    const existingMember = formData.householdData[index];
    return {
      birthMonth: existingMember?.birthMonth ? String(existingMember.birthMonth) : '',
      birthYear: existingMember?.birthYear ? String(existingMember.birthYear) : '',
      relationshipToHH: existingMember?.relationshipToHH || (index === 0 ? 'headOfHousehold' : ''),
    };
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      members: defaultMembers,
    },
    questionName: 'householdData',
  });

  const { fields } = useFieldArray({
    control,
    name: 'members',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ members }) => {
    if (!uuid) return;

    // Update householdData with the basic info
    const updatedHouseholdData = members.map((member, index) => {
      const existingMember = formData.householdData[index];
      return {
        ...existingMember,
        id: existingMember?.id ?? crypto.randomUUID(),
        frontendId: existingMember?.frontendId ?? crypto.randomUUID(),
        birthMonth: Number(member.birthMonth),
        birthYear: Number(member.birthYear),
        relationshipToHH: member.relationshipToHH,
        conditions: existingMember?.conditions ?? {
          student: false,
          pregnant: false,
          blindOrVisuallyImpaired: false,
          disabled: false,
          longTermDisability: false,
          none: false,
        },
        hasIncome: existingMember?.hasIncome ?? false,
        incomeStreams: existingMember?.incomeStreams ?? [],
        healthInsurance: existingMember?.healthInsurance ?? {
          none: false,
          employer: false,
          private: false,
          medicaid: false,
          medicare: false,
          chp: false,
          emergency_medicaid: false,
          family_planning: false,
          va: false,
          mass_health: false,
        },
      };
    });

    const updatedFormData = {
      ...formData,
      householdData: updatedHouseholdData,
    };

    await updateScreen(updatedFormData);

    // Navigate to first member's detail page
    navigate(`/${whiteLabel}/${uuid}/step-${currentStepId}/1`);
  };

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
    <main className="benefits-form">
      <QuestionHeader>
        <FormattedMessage
          id="householdDataBlock.basicInfo.header"
          defaultMessage="Tell us about each household member"
        />
      </QuestionHeader>
      <Typography sx={{ marginBottom: '1.5rem', fontSize: '1rem', color: '#666' }}>
        <FormattedMessage
          id="householdDataBlock.basicInfo.subheader"
          defaultMessage="We'll ask about their birth date and relationship to you"
        />
      </Typography>

      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fields.map((field, index) => (
            <Box
              key={field.id}
              sx={{
                padding: '1rem',
                backgroundColor: 'var(--secondary-background-color)',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <PersonIcon style={{ width: '2rem', height: '2rem', fill: 'var(--primary-color)' }} />
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--secondary-color)', fontFamily: 'var(--font-heading)' }}>
                  {index === 0 ? (
                    <FormattedMessage id="householdDataBlock.basicInfo.you" defaultMessage="You" />
                  ) : (
                    <FormattedMessage
                      id="householdDataBlock.basicInfo.person"
                      defaultMessage="Person {number}"
                      values={{ number: index + 1 }}
                    />
                  )}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: '1rem' }}>
                {/* Birth Month */}
                <FormControl fullWidth error={errors.members?.[index]?.birthMonth !== undefined}>
                  <InputLabel>
                    <FormattedMessage id="ageInput.birthMonth" defaultMessage="Birth Month" />
                  </InputLabel>
                  <Controller
                    name={`members.${index}.birthMonth`}
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Birth Month">
                        {monthMenuItems}
                      </Select>
                    )}
                  />
                  {errors.members?.[index]?.birthMonth && (
                    <Typography sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      <ErrorMessageWrapper fontSize="0.75rem">
                        {errors.members[index]?.birthMonth?.message}
                      </ErrorMessageWrapper>
                    </Typography>
                  )}
                </FormControl>

                {/* Birth Year */}
                <FormControl fullWidth error={errors.members?.[index]?.birthYear !== undefined}>
                  <Controller
                    name={`members.${index}.birthYear`}
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
                  {errors.members?.[index]?.birthYear && (
                    <Typography sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      <ErrorMessageWrapper fontSize="0.75rem">
                        {errors.members[index]?.birthYear?.message}
                      </ErrorMessageWrapper>
                    </Typography>
                  )}
                </FormControl>

                {/* Relationship */}
                <FormControl fullWidth error={errors.members?.[index]?.relationshipToHH !== undefined}>
                  <InputLabel>
                    <FormattedMessage
                      id="householdDataBlock.relationshipToYou"
                      defaultMessage="Relationship to you"
                    />
                  </InputLabel>
                  <Controller
                    name={`members.${index}.relationshipToHH`}
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Relationship to you" disabled={index === 0}>
                        {index === 0 ? (
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
                  {errors.members?.[index]?.relationshipToHH && (
                    <Typography sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      <ErrorMessageWrapper fontSize="0.75rem">
                        {errors.members[index]?.relationshipToHH?.message}
                      </ErrorMessageWrapper>
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>
          ))}
        </Box>

        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default HouseholdMemberBasicInfoPage;
