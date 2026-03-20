import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { postMessage } from '../../../apiCalls';
import ErrorMessageWrapper from '../../ErrorMessage/ErrorMessageWrapper';
import './SaveMyResultsModal.css';

type SaveViaWhatsAppFormProps = {
  onSuccess: () => void;
};

const SaveViaWhatsAppForm = ({ onSuccess }: SaveViaWhatsAppFormProps) => {
  const { uuid } = useParams();
  const { formatMessage } = useIntl();
  const [apiError, setApiError] = useState<string | null>(null);

  const invalidMsg = formatMessage({
    id: 'validation-helperText.whatsappNumber',
    defaultMessage: 'Please enter a valid international phone number',
  });

  const schema = z.object({
    phone: z
      .string()
      .trim()
      .refine(
        (value) => {
          const parsed = parsePhoneNumberFromString(value);
          return parsed?.isValid() ?? false;
        },
        { message: invalidMsg },
      ),
  });

  const {
    setValue,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const phoneValue = watch('phone');
  const hasError = errors.phone !== undefined || apiError !== null;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (uuid === undefined) throw new Error('uuid is not defined');
    setApiError(null);
    try {
      // Send the full E.164 number (e.g. +447911123456) — backend uses it as-is for WhatsApp
      await postMessage({ screen: uuid, whatsapp: data.phone, type: 'whatsappScreen' });
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
        <FormattedMessage id="saveMyResults.whatsappLabel" defaultMessage="WhatsApp Number" />
      </label>
      <div className={`save-my-results-intl-phone-wrapper${hasError ? ' save-my-results-intl-phone-wrapper--error' : ''}`}>
        <PhoneInput
          value={phoneValue}
          onChange={(value) => setValue('phone', value, { shouldValidate: false })}
          defaultCountry="us"
        />
        {hasError && (
          <p className="save-my-results-intl-phone-error">
            <ErrorMessageWrapper>
              {errors.phone !== undefined ? errors.phone.message : apiError}
            </ErrorMessageWrapper>
          </p>
        )}
        {!hasError && (
          <p className="save-my-results-intl-phone-helper">
            <FormattedMessage id="saveMyResults.whatsappHelper" defaultMessage="Include your country code" />
          </p>
        )}
      </div>
      <div className="save-my-results-form-actions">
        <button type="submit" className="save-my-results-send-btn">
          <FormattedMessage id="saveMyResults.sendResults" defaultMessage="Send Results" />
        </button>
      </div>
    </form>
  );
};

export default SaveViaWhatsAppForm;
