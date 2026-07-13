import { useState, useCallback, useRef, useEffect } from 'react';

const COPY_FEEDBACK_MS = 2000;

type UseCopyFeedbackReturn = {
  copied: boolean;
  copyError: boolean;
  handleCopy: (text: string) => void;
};

export function useCopyFeedback(onSuccess?: () => void): UseCopyFeedbackReturn {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the latest callback without re-creating handleCopy each render.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const handleCopy = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setCopyError(false);
        // Fire on every successful write (not derived from `copied` state, which
        // wouldn't change on a repeat copy while feedback is still showing).
        onSuccessRef.current?.();
        timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      },
      () => {
        // Clipboard API unavailable or permission denied — show error to user
        setCopyError(true);
        timerRef.current = setTimeout(() => setCopyError(false), COPY_FEEDBACK_MS);
      },
    );
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { copied, copyError, handleCopy };
}

export { COPY_FEEDBACK_MS };
