import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { postMessage } from '../../../apiCalls';

type PostMessagePayload = Parameters<typeof postMessage>[0];

type UseSaveResultsSubmitOptions<TData> = {
  buildPayload: (data: TData) => Omit<PostMessagePayload, 'screen'>;
  onSuccess: () => void;
};

type UseSaveResultsSubmitReturn<TData> = {
  apiError: string | null;
  isSubmitting: boolean;
  clearApiError: () => void;
  onSubmit: (data: TData) => Promise<void>;
};

export function useSaveResultsSubmit<TData>({
  buildPayload,
  onSuccess,
}: UseSaveResultsSubmitOptions<TData>): UseSaveResultsSubmitReturn<TData> {
  const { uuid } = useParams();
  const { formatMessage } = useIntl();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearApiError = () => setApiError(null);

  const onSubmit = async (data: TData) => {
    if (uuid === undefined) {
      setApiError(
        formatMessage({
          id: 'emailResults.error',
          defaultMessage: 'Failed to send. Please try again.',
        }),
      );
      return;
    }
    setApiError(null);
    setIsSubmitting(true);
    try {
      await postMessage({ screen: uuid, ...buildPayload(data) });
      onSuccess();
    } catch {
      // Network or server error — surface to user rather than swallowing
      setApiError(
        formatMessage({
          id: 'emailResults.error',
          defaultMessage: 'Failed to send. Please try again.',
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return { apiError, isSubmitting, clearApiError, onSubmit };
}
