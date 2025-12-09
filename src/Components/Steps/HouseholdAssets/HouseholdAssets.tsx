import { Controller, SubmitHandler } from 'react-hook-form';
import { InputAdornment, Stack, TextField } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import QuestionHeader from '../../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../../QuestionComponents/QuestionQuestion';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';
import PrevAndContinueButtons from '../../PrevAndContinueButtons/PrevAndContinueButtons';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Context } from '../../Wrapper/Wrapper';
import { useDefaultBackNavigationFunction } from '../../QuestionComponents/questionHooks';
import useScreenApi from '../../../Assets/updateScreen';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { NUM_PAD_PROPS, handleNumbersOnly } from '../../../Assets/numInputHelpers';
import useStepForm from '../stepForm';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './HouseholdAssets.css';

const HouseholdAssets = () => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const backNavigationFunction = useDefaultBackNavigationFunction('householdAssets');
  const intl = useIntl();
  const { updateScreen } = useScreenApi();

  const formSchema = z.object({
    cashAssets: z.coerce
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
    investmentAssets: z.coerce
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
      cashAssets: formData.householdAssets ?? 0,
      investmentAssets: 0,
    },
    questionName: 'householdAssets',
  });

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ cashAssets, investmentAssets }) => {
    if (!uuid) {
      throw new Error('no uuid');
    }
    const totalAssets = cashAssets + investmentAssets;
    const updatedFormData = { ...formData, householdAssets: totalAssets };
    await updateScreen(updatedFormData);
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="qcc.about_household" defaultMessage="Tell us about your household" />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="questions.householdAssets"
          defaultMessage="How much does your whole household have right now in:"
        />
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <Stack spacing={2} sx={{ mt: 2, mb: 2 }}>
          <div className="asset-box">
            <QuestionDescription>
              <FormattedMessage
                id="questions.householdAssets-cashLabel"
                defaultMessage="Cash, checking or savings accounts"
              />
            </QuestionDescription>
            <Controller
              name="cashAssets"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    sx: { backgroundColor: '#FFFFFF' },
                  }}
                  inputProps={NUM_PAD_PROPS}
                  onChange={handleNumbersOnly(field.onChange)}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  error={errors.cashAssets !== undefined}
                  helperText={
                    errors.cashAssets !== undefined && (
                      <ErrorMessageWrapper fontSize="var(--error-message-font-size)">
                        {errors.cashAssets?.message}
                      </ErrorMessageWrapper>
                    )
                  }
                />
              )}
            />
          </div>

          <div className="asset-box">
            <QuestionDescription>
              <FormattedMessage
                id="questions.householdAssets-investmentLabel"
                defaultMessage="Stocks, bonds, or mutual funds"
              />
            </QuestionDescription>
            <Controller
              name="investmentAssets"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    sx: { backgroundColor: '#FFFFFF' },
                  }}
                  inputProps={NUM_PAD_PROPS}
                  onChange={handleNumbersOnly(field.onChange)}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  error={errors.investmentAssets !== undefined}
                  helperText={
                    errors.investmentAssets !== undefined && (
                      <ErrorMessageWrapper fontSize="var(--error-message-font-size)">
                        {errors.investmentAssets?.message}
                      </ErrorMessageWrapper>
                    )
                  }
                />
              )}
            />
          </div>
        </Stack>
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
};

export default HouseholdAssets;
