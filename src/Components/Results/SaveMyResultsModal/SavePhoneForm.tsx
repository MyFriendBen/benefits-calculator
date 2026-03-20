import { useContext } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Context } from '../../Wrapper/Wrapper';
import { postMessage } from '../../../apiCalls';
import PhoneNumberInput from '../../Common/PhoneNumberInput';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './SaveMyResultsModal.css';

type SavePhoneFormProps = {
  onSuccess: () => void;
  onError: () => void;
};

const SavePhoneForm = ({ onSuccess, onError }: SavePhoneFormProps) => {
  const { formData } = useContext(Context);
  const { uuid } = useParams();
  const { formatMessage } = useIntl();

  const schema = z.object({
    phone: z
      .string({
        errorMap: () => ({
          message: formatMessage({
            id: 'validation-helperText.phoneNumber',
            defaultMessage: 'Please enter a 10 digit phone number',
          }),
        }),
      })
      .trim()
      .transform((value) => value.replace(/\D/g, ''))
      .refine((value) => value.length === 10, {
        message: formatMessage({
          id: 'validation-helperText.phoneNumber',
          defaultMessage: 'Please enter a 10 digit phone number',
        }),
      }),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: formData.signUpInfo.phone ?? '' },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (uuid === undefined) throw new Error('uuid is not defined');
    try {
      await postMessage({ screen: uuid, phone: data.phone, type: 'textScreen' });
      onSuccess();
    } catch {
      onError();
    }
  };

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
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            name={field.name}
            placeholder="1234567890"
            error={errors.phone !== undefined}
            helperText={
              errors.phone !== undefined
                ? <ErrorMessageWrapper>{errors.phone.message}</ErrorMessageWrapper>
                : <FormattedMessage id="saveMyResults.phoneHelper" defaultMessage="Enter 10-digit phone number without spaces or dashes" />
            }
            sx={{ mb: 0 }}
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

export default SavePhoneForm;
