import { useContext } from 'react';
import { TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../Wrapper/Wrapper';
import { useSaveResultsSubmit } from '../shared/useSaveResultsSubmit';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './SaveMyResultsModal.css';

type SaveViaEmailFormProps = {
  onSuccess: () => void;
};

const SaveViaEmailForm = ({ onSuccess }: SaveViaEmailFormProps) => {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();

  const schema = z.object({
    email: z
      .string({
        errorMap: () => ({
          message: formatMessage({
            id: 'validation-helperText.email',
            defaultMessage: 'Please enter a valid email address',
          }),
        }),
      })
      .email()
      .trim(),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: formData.signUpInfo.email ?? '' },
  });

  const { apiError, isSubmitting, clearApiError, onSubmit } = useSaveResultsSubmit<z.infer<typeof schema>>({
    buildPayload: (data) => ({ email: data.email, type: 'emailScreen' }),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="save-my-results-form">
      <label className="save-my-results-field-label">
        <FormattedMessage id="saveMyResults.emailLabel" defaultMessage="Email Address" />
      </label>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            onChange={(e) => {
              field.onChange(e);
              clearApiError();
            }}
            placeholder={formatMessage({ id: 'saveMyResults.emailPlaceholder', defaultMessage: 'your.email@example.com' })}
            variant="outlined"
            error={errors.email !== undefined || apiError !== null}
            helperText={
              errors.email !== undefined ? (
                <ErrorMessageWrapper>{errors.email.message}</ErrorMessageWrapper>
              ) : apiError !== null ? (
                <ErrorMessageWrapper>{apiError}</ErrorMessageWrapper>
              ) : undefined
            }
            fullWidth
            InputProps={{ className: 'save-my-results-input' }}
          />
        )}
      />
      <div className="save-my-results-form-actions">
        <button type="submit" className="modal-primary-btn" disabled={isSubmitting}>
          <FormattedMessage id="saveMyResults.sendResults" defaultMessage="Send Results" />
        </button>
      </div>
    </form>
  );
};

export default SaveViaEmailForm;
