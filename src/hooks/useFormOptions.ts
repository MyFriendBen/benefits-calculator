import { useState, useEffect } from 'react';

export interface FormOptionText {
  label: string;
  default_message: string;
}

export interface FormOption {
  value: string;
  icon: string | null;
  text: FormOptionText;
}

export interface FormOptionsResponse {
  condition_options: FormOption[];
  health_insurance_options: FormOption[];
}

const domain = process.env.REACT_APP_DOMAIN_URL;

export function useFormOptions(whiteLabel: string) {
  const [formOptions, setFormOptions] = useState<FormOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!whiteLabel) {
      setLoading(false);
      return;
    }

    const apiKey = 'Token ' + process.env.REACT_APP_API_KEY;
    const controller = new AbortController();

    setLoading(true);

    fetch(`${domain}/api/${whiteLabel}/form-options/`, {
      headers: {
        Accept: 'application/json',
        Authorization: apiKey,
      },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch form options: ${res.status}`);
        return res.json() as Promise<FormOptionsResponse>;
      })
      .then((data) => {
        setFormOptions(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        // Ignore aborts from a superseded white label / unmount.
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
  }, [whiteLabel]);

  return { formOptions, loading, error };
}
