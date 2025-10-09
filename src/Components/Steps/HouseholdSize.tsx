import { TextField } from '@mui/material';
import { Controller, SubmitHandler } from 'react-hook-form';
import { Context } from '../Wrapper/Wrapper';
import { useContext } from 'react';
import * as z from 'zod';
import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import { useParams } from 'react-router-dom';
import { useDefaultBackNavigationFunction, useGoToNextStep } from '../QuestionComponents/questionHooks';
import HelpButton from '../HelpBubbleIcon/HelpButton';
import { handleNumbersOnly, NUM_PAD_PROPS } from '../../Assets/numInputHelpers';
import useScreenApi from '../../Assets/updateScreen';
import { OverrideableTranslation } from '../../Assets/languageOptions';
import useStepForm from './stepForm';
import { zodResolver } from '@hookform/resolvers/zod';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';

const HouseholdSize = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('householdSize');
  const nextStep = useGoToNextStep('householdSize', '1');
  const intl = useIntl();
  const { updateScreen } = useScreenApi();

  const formSchema = z.object({
    householdSize: z.coerce
      .number({
        errorMap: () => {
          return {
            message: intl.formatMessage({
              id: 'errorMessage-numberOfHHMembers',
              defaultMessage: 'Please enter the number of people in your household (max. 8)',
            }),
          };
        },
      })
      .int()
      .positive()
      .lte(8),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      householdSize: formData.householdSize || undefined,
    },
    questionName: 'householdSize',
    onSubmitSuccessfulOverride: nextStep,
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ householdSize }) => {
    if (uuid) {
      const updatedFormData = {
        ...formData,
        householdSize,
        householdData: formData.householdData.slice(0, householdSize),
      };
      await updateScreen(updatedFormData);
    }
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <>
          <OverrideableTranslation
            id="questions.householdSize"
            defaultMessage="Including you, how many people are in your household?"
          />
          <HelpButton>
            <OverrideableTranslation
              id="questions.householdSize-helpText"
              defaultMessage="This is usually family members whom you live with and share important resources with like food and bills. If other adults 18 or older in your household file their own tax return, ask them to complete this tool to determine if they qualify for benefits. But even if you and your spouse file taxes separately, include your spouse in the household."
            />
          </HelpButton>
        </>
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="householdSize"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              {...field}
              label={<FormattedMessage id="questions.householdSize-inputLabel" defaultMessage="Household Size" />}
              variant="outlined"
              inputProps={NUM_PAD_PROPS}
              onChange={handleNumbersOnly(field.onChange)}
              onFocus={(e) => {
                e.target.select();
              }}
              error={errors.householdSize !== undefined}
              helperText={
                errors.householdSize !== undefined && (
                  <ErrorMessageWrapper fontSize="1rem">{errors.householdSize?.message}</ErrorMessageWrapper>
                )
              }
            />
          )}
        />
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default HouseholdSize;
