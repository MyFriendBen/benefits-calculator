import { useState, useCallback } from 'react';

const COPY_FEEDBACK_MS = 2000;

type UseCopyFeedbackReturn = {
  copied: boolean;
  copyError: boolean;
  handleCopy: (text: string) => void;
};

export function useCopyFeedback(): UseCopyFeedbackReturn {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setCopyError(false);
        setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      },
      () => {
        // Clipboard API unavailable or permission denied — show error to user
        setCopyError(true);
        setTimeout(() => setCopyError(false), COPY_FEEDBACK_MS);
      },
    );
  }, []);

  return { copied, copyError, handleCopy };
}

export { COPY_FEEDBACK_MS };
