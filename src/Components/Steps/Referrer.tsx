import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Context } from '../Wrapper/Wrapper';
import * as z from 'zod';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import { useDefaultBackNavigationFunction } from '../QuestionComponents/questionHooks';
import { useReferralOptions } from '../../hooks/useReferralOptions';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';
import useScreenApi from '../../Assets/updateScreen';
import useStepForm from './stepForm';

export default function ReferralSourceStep() {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const { updateScreen } = useScreenApi();
  const backNavigationFunction = useDefaultBackNavigationFunction('referralSource');
  const { referralOptions, allOptions, loading, error } = useReferralOptions();
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
    !loading &&
    !error &&
    formData.referralSource !== undefined &&
    formData.referralSource !== '' &&
    !(formData.referralSource in allOptions);

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

  if (uuid === undefined) {
    throw new Error('no uuid');
  }

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={formatMessage({
          id: 'errorMessage.referralOptions.loadFailed',
          defaultMessage: 'Something went wrong loading this page. Please refresh and try again.',
        })}
      />
    );
  }

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

    const genericItems = Object.entries(referralOptions.generic).map(([value, name]) => (
      <MenuItem value={value} key={value}>
        {formatMessage({ id: `referralOptions.${value}`, defaultMessage: name })}
      </MenuItem>
    ));

    const partnerItems =
      Object.keys(referralOptions.partners).length > 0
        ? [
            <ListSubheader key="partners-header">
              <FormattedMessage id="qcc.createReferralDropdownMenu-partnersHeader" defaultMessage="Partners" />
            </ListSubheader>,
            ...Object.entries(referralOptions.partners).map(([value, name]) => (
              <MenuItem value={value} key={value}>
                {formatMessage({ id: `referralOptions.${value}`, defaultMessage: name })}
              </MenuItem>
            )),
          ]
        : [];

    return [disabledSelectMenuItem, ...genericItems, ...partnerItems];
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
                    <ErrorMessageWrapper>{errors.referralSource.message}</ErrorMessageWrapper>
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
                      <ErrorMessageWrapper>{errors.otherReferrer.message}</ErrorMessageWrapper>
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
