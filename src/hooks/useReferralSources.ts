import { useContext, useEffect, useState } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { getReferralSources } from '../apiCalls';

export type ReferralOptions = Record<string, string>;

export function useReferralSources(): { referralOptions: ReferralOptions; loading: boolean; error: Error | null } {
  const { whiteLabel } = useContext(Context);
  const [referralOptions, setReferralOptions] = useState<ReferralOptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    getReferralSources(whiteLabel, controller.signal)
      .then((data) => {
        if (!cancelled) {
          setReferralOptions(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setReferralOptions({});
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [whiteLabel]);

  return { referralOptions, loading, error };
}
