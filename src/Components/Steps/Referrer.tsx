import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { FormattedMessageType } from '../../Types/Questions';
import { Context } from '../Wrapper/Wrapper';
import * as z from 'zod';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import { useDefaultBackNavigationFunction } from '../QuestionComponents/questionHooks';
import { useConfig } from '../Config/configHook';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';
import useScreenApi from '../../Assets/updateScreen';
import useStepForm from './stepForm';

type ReferralOptions = {
  other: string;
  [key: string]: string | FormattedMessageType;
};

export default function ReferralSourceStep() {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const { updateScreen } = useScreenApi();

  if (uuid === undefined) {
    throw new Error('no uuid');
  }

  const backNavigationFunction = useDefaultBackNavigationFunction('referralSource');
  const referralOptions = useConfig<ReferralOptions>('referral_options');
  const { formatMessage } = useIntl();

  const formSchema = z
    .object({
      referralSource: z.string().min(
        1,
        formatMessage({
          id: 'validation-helperText.referralSource',
          defaultMessage: 'Please select a referral source.',
        }),
      ),
      otherReferrer: z.string().trim(),
    })
    .refine((val) => val.referralSource !== 'other' || val.otherReferrer.length > 0, {
      message: formatMessage({
        id: 'errorMessage-otherReferralSource',
        defaultMessage: 'Please type in your referral source',
      }),
      path: ['otherReferrer'],
    })
    .transform((val) => {
      if (val.referralSource === 'other') {
        return val;
      }

      return { ...val, otherReferrer: '' };
    });

  type FormSchema = z.infer<typeof formSchema>;

  const isOtherSource =
    formData.referralSource !== undefined &&
    formData.referralSource !== '' &&
    !(formData.referralSource in referralOptions);

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
  } = useStepForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referralSource: isOtherSource ? 'other' : formData.referralSource ?? '',
      otherReferrer: isOtherSource ? formData.referralSource ?? '' : '',
    },
    questionName: 'referralSource',
  });

  const referralSource = watch('referralSource');
  const showOtherSource = referralSource === 'other';

  const formSubmitHandler: SubmitHandler<FormSchema> = async ({ referralSource, otherReferrer }) => {
    const source = otherReferrer !== '' ? otherReferrer : referralSource;
    const updatedFormData = { ...formData, referralSource: source };
    await updateScreen(updatedFormData);
  };

  const createMenuItems = () => {
    const disabledSelectMenuItem = (
      <MenuItem value="disabled-select" key="disabled-select" disabled>
        <FormattedMessage
          id="qcc.createReferralDropdownMenu-disabledSelectMenuItemText"
          defaultMessage="Select a source"
        />
      </MenuItem>
    );

    const dropdownMenuItems = Object.entries(referralOptions).map(([value, message]) => {
      return (
        <MenuItem value={value} key={value}>
          {message}
        </MenuItem>
      );
    });

    return [disabledSelectMenuItem, dropdownMenuItems];
  };

  return (
    <div>
      <QuestionHeader>
        <FormattedMessage id="questions.referralSource" defaultMessage="Just one more question!" />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage
          id="questions.referralSource-subheader"
          defaultMessage="How did you hear about MyFriendBen?"
        />
      </QuestionQuestion>
      <form onSubmit={handleSubmit(formSubmitHandler)}>
        <FormControl sx={{ mt: 1, mb: 2, minWidth: 210, maxWidth: '100%' }} error={errors.referralSource !== undefined}>
          <InputLabel id="county">
            <FormattedMessage id="qcc.createReferralDropdownMenu-label" defaultMessage="Referral Source" />
          </InputLabel>
          <Controller
            name="referralSource"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  {...field}
                  labelId="county-select-label"
                  id="referral-source-select"
                  label={
                    <FormattedMessage id="qcc.createReferralDropdownMenu-label" defaultMessage="Referral Source" />
                  }
                  MenuProps={{
                    PaperProps: { sx: { maxHeight: 400 } },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                >
                  {createMenuItems()}
                </Select>
                {errors.referralSource !== undefined && (
                  <FormHelperText>
                    <ErrorMessageWrapper fontSize="0.75rem">{errors.referralSource.message}</ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </>
            )}
          />
        </FormControl>
        {showOtherSource && (
          <div>
            <QuestionQuestion>
              <FormattedMessage id="questions.referralSource-a" defaultMessage="If other, please specify:" />
            </QuestionQuestion>
            <Controller
              name="otherReferrer"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={
                    <FormattedMessage
                      id="questions.referralSource-a-inputLabel"
                      defaultMessage="Other referral source"
                    />
                  }
                  variant="outlined"
                  error={errors.otherReferrer !== undefined}
                  helperText={
                    errors.otherReferrer !== undefined && (
                      <ErrorMessageWrapper fontSize="0.75rem">{errors.otherReferrer.message}</ErrorMessageWrapper>
                    )
                  }
                />
              )}
            />
          </div>
        )}
        <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
      </form>
    </div>
  );
}
