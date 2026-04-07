import { useContext, useEffect, useState } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { getReferralSources } from '../apiCalls';

export type ReferralOptions = Record<string, string>;

export function useReferralSources(): { referralOptions: ReferralOptions; loading: boolean } {
  const { whiteLabel } = useContext(Context);
  const [referralOptions, setReferralOptions] = useState<ReferralOptions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReferralSources(whiteLabel)
      .then((data) => {
        setReferralOptions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load referral sources:', error);
        setReferralOptions({});
        setLoading(false);
      });
  }, [whiteLabel]);

  return { referralOptions, loading };
}
