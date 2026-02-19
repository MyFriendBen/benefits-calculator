import { Controller, SubmitHandler } from 'react-hook-form';
import { InputAdornment, TextField } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import HelpButton from '../../HelpBubbleIcon/HelpButton';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Context } from '../../Wrapper/Wrapper';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import useScreenApi from '../../../Assets/updateScreen';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';

import { NumericFormat } from 'react-number-format';
import useStepForm from '../stepForm';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';

const HouseholdAssets = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('householdAssets');
  const intl = useIntl();
  const { updateScreen } = useScreenApi();

  const formSchema = z.object({
    householdAssets: z
      .number({
        errorMap: () => {
          return {
            message: intl.formatMessage({
              id: 'validation-helperText.assets',
              defaultMessage: 'Please enter 0 or a positive number.',
            }),
          };
        },
      })
      .int()
      .min(0),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      householdAssets: formData.householdAssets ?? 0,
    },
    questionName: 'householdAssets',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ householdAssets }) => {
    if (!uuid) {
      throw new Error('no uuid');
    }
    const updatedFormData = { ...formData, householdAssets: householdAssets };
    await updateScreen(updatedFormData);
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <>
          <FormattedMessage
            id="questions.householdAssets"
            defaultMessage="How much does your whole household have right now in cash, checking or savings accounts, stocks, bonds, or mutual funds?"
          />
          <HelpButton>
            <FormattedMessage
              id="questions.householdAssets-description"
              defaultMessage="In some cases, eligibility for benefits may be affected if your household owns other valuable assets such as a car or life insurance policy."
            />
          </HelpButton>
        </>
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Controller
          name="householdAssets"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <NumericFormat
              value={field.value || ''}
              onValueChange={({ floatValue }) => field.onChange(floatValue ?? 0)}
              thousandSeparator
              allowNegative={false}
              decimalScale={0}
              customInput={TextField}
              label={<FormattedMessage id="questions.householdAssets-inputLabel" defaultMessage="Dollar Amount" />}
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                sx: { backgroundColor: '#FFFFFF' },
              }}
              inputProps={{ inputMode: 'decimal' }}
              onFocus={(e) => {
                e.target.select();
              }}
              error={errors.householdAssets !== undefined}
              helperText={
                errors.householdAssets !== undefined && (
                  <ErrorMessageWrapper fontSize="1rem">{errors.householdAssets?.message}</ErrorMessageWrapper>
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

export default HouseholdAssets;
