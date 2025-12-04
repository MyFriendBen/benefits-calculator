import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFieldArray, SubmitHandler } from 'react-hook-form';
import { Typography } from '@mui/material';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../../Wrapper/Wrapper';
import QuestionHeader from '../../../QuestionComponents/QuestionHeader';
import PrevAndContinueButtons from '../../../PrevAndContinueButtons/PrevAndContinueButtons';
import useScreenApi from '../../../../Assets/updateScreen';
import useStepForm from '../../stepForm';
import { FormattedMessageType } from '../../../../Types/Questions';
import { useConfig } from '../../../Config/configHook';
import { getCurrentMonthYear, MAX_AGE } from '../../../../Assets/age';
import { useStepNumber } from '../../../../Assets/stepDirectory';
import { ReactComponent as PersonIcon } from '../../../../Assets/icons/General/head.svg';
import BasicInfoSection from '../sections/BasicInfoSection';
import '../styles/HouseholdMemberBasicInfoPage.css';

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
    birthMonth: z.number().min(1, {
      message: intl.formatMessage({
        id: 'ageInput.month.error',
        defaultMessage: 'Please enter a birth month.',
      }),
    }).max(12),
    birthYear: z.coerce
      .number()
      .min(CURRENT_YEAR - MAX_AGE, {
        message: intl.formatMessage({
          id: 'ageInput.year.error',
          defaultMessage: 'Please enter a birth year.',
        }),
      })
      .max(CURRENT_YEAR, {
        message: intl.formatMessage({
          id: 'ageInput.year.error',
          defaultMessage: 'Please enter a birth year.',
        }),
      }),
    relationshipToHH: z.string().min(1, {
      message: intl.formatMessage({
        id: 'errorMessage-HHMemberRelationship',
        defaultMessage: 'Please select a relationship.',
      }),
    }),
  }).refine(
    ({ birthMonth, birthYear }) => {
      if (birthYear === CURRENT_YEAR) {
        return birthMonth <= CURRENT_MONTH;
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
      birthMonth: existingMember?.birthMonth || 0,
      birthYear: existingMember?.birthYear || ('' as unknown as number),
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
        birthMonth: member.birthMonth,
        birthYear: member.birthYear,
        relationshipToHH: member.relationshipToHH,
        specialConditions: existingMember?.specialConditions ?? {
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


  return (
    <main className="benefits-form">
      <QuestionHeader>
        <FormattedMessage
          id="householdDataBlock.basicInfo.header"
          defaultMessage="Tell us about each household member"
        />
      </QuestionHeader>
      <Typography className="household-basic-info-page__subheader">
        <FormattedMessage
          id="householdDataBlock.basicInfo.subheader"
          defaultMessage="We'll ask about their birth date and relationship to you"
        />
      </Typography>

      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <div className="household-basic-info-page__form-container">
          {fields.map((field, index) => (
            <div key={field.id} className="household-basic-info-page__person-card">
              <div className="household-basic-info-page__person-header">
                <PersonIcon className="household-basic-info-page__person-icon" />
                <Typography className="household-basic-info-page__person-title">
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
              </div>

              <div className="household-basic-info-page__fields-grid">
                <BasicInfoSection
                  control={control}
                  errors={errors}
                  fieldPrefix={`members.${index}`}
                  isFirstMember={index === 0}
                  relationshipOptions={relationshipOptions}
                  showSectionHeader={false}
                />
              </div>
            </div>
          ))}
        </div>

        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </main>
  );
};

export default HouseholdMemberBasicInfoPage;
