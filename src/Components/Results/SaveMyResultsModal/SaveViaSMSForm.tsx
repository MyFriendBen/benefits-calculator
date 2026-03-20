import { useContext } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../Wrapper/Wrapper';
import { useSaveResultsSubmit } from '../shared/useSaveResultsSubmit';
import PhoneNumberInput from '../../Common/PhoneNumberInput';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './SaveMyResultsModal.css';

type SaveViaSMSFormProps = {
  onSuccess: () => void;
};

const SaveViaSMSForm = ({ onSuccess }: SaveViaSMSFormProps) => {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();

  const phoneErrorMsg = formatMessage({
    id: 'validation-helperText.phoneNumber',
    defaultMessage: 'Please enter a 10 digit phone number',
  });

  const schema = z.object({
    phone: z
      .string({ errorMap: () => ({ message: phoneErrorMsg }) })
      .trim()
      .transform((value) => value.replace(/\D/g, ''))
      .refine((value) => value.length === 10, { message: phoneErrorMsg }),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: formData.signUpInfo.phone ?? '' },
  });

  const { apiError, isSubmitting, clearApiError, onSubmit } = useSaveResultsSubmit<z.infer<typeof schema>>({
    buildPayload: (data) => ({ phone: data.phone, type: 'textScreen' }),
    onSuccess,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="save-my-results-form">
      <label className="save-my-results-field-label">
        <FormattedMessage id="saveMyResults.phoneLabel" defaultMessage="Phone Number" />
      </label>
      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <PhoneNumberInput
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              clearApiError();
            }}
            onBlur={field.onBlur}
            inputRef={field.ref}
            name={field.name}
            error={errors.phone !== undefined || apiError !== null}
            helperText={
              errors.phone !== undefined ? (
                <ErrorMessageWrapper>{errors.phone.message}</ErrorMessageWrapper>
              ) : apiError !== null ? (
                <ErrorMessageWrapper>{apiError}</ErrorMessageWrapper>
              ) : (
                <FormattedMessage id="saveMyResults.phoneHelper" defaultMessage="Enter 10-digit US phone number" />
              )
            }
            sx={{ mb: 0 }}
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

export default SaveViaSMSForm;
