import { useContext, useEffect, useState } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { getReferralOptions } from '../apiCalls';

export type ReferralOptionGroup = Record<string, string>;

export interface ReferralOptions {
  generic: ReferralOptionGroup;
  partners: ReferralOptionGroup;
}

const EMPTY_REFERRAL_OPTIONS: ReferralOptions = { generic: {}, partners: {} };

export function useReferralOptions(): {
  referralOptions: ReferralOptions;
  allOptions: ReferralOptionGroup;
  loading: boolean;
  error: Error | null;
} {
  const { whiteLabel } = useContext(Context);
  const [referralOptions, setReferralOptions] = useState<ReferralOptions>(EMPTY_REFERRAL_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    getReferralOptions(whiteLabel, controller.signal)
      .then((data) => {
        if (!cancelled) {
          setReferralOptions(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setReferralOptions(EMPTY_REFERRAL_OPTIONS);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [whiteLabel]);

  const allOptions = { ...referralOptions.generic, ...referralOptions.partners };

  return { referralOptions, allOptions, loading, error };
}
