import { useContext, useState } from 'react';
import { TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../Wrapper/Wrapper';
import { postMessage } from '../../../apiCalls';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './SaveMyResultsModal.css';

type SaveEmailFormProps = {
  onSuccess: () => void;
};

const SaveEmailForm = ({ onSuccess }: SaveEmailFormProps) => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const { formatMessage } = useIntl();
  const [apiError, setApiError] = useState<string | null>(null);

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

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (uuid === undefined) throw new Error('uuid is not defined');
    setApiError(null);
    try {
      await postMessage({ screen: uuid, email: data.email, type: 'emailScreen' });
      onSuccess();
    } catch {
      setApiError(
        formatMessage({
          id: 'emailResults.error',
          defaultMessage: 'Failed to send. Please try again.',
        }),
      );
    }
  };

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
            placeholder={formatMessage({ id: 'saveMyResults.emailPlaceholder', defaultMessage: 'your.email@example.com' })}
            variant="outlined"
            error={errors.email !== undefined || apiError !== null}
            helperText={
              errors.email !== undefined
                ? <ErrorMessageWrapper>{errors.email.message}</ErrorMessageWrapper>
                : apiError !== null
                  ? <ErrorMessageWrapper>{apiError}</ErrorMessageWrapper>
                  : undefined
            }
            fullWidth
            InputProps={{ className: 'save-my-results-input' }}
          />
        )}
      />
      <div className="save-my-results-form-actions">
        <button type="submit" className="save-my-results-send-btn">
          <FormattedMessage id="saveMyResults.sendResults" defaultMessage="Send Results" />
        </button>
      </div>
    </form>
  );
};

export default SaveEmailForm;
