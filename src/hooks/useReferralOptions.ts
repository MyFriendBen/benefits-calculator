import { useContext, useMemo } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';

export type ReferralOptionGroup = Record<string, string>;

export interface ReferralOptions {
  generic: ReferralOptionGroup;
  partners: ReferralOptionGroup;
  // Referrers left out of the dropdown (show_in_dropdown=False) but still recognized as
  // ?referrer= codes. Optional because older API deploys don't send it.
  hidden?: ReferralOptionGroup;
}

/** Reads referral option payloads fetched once in `Wrapper` (see `getReferralOptions`). */
export function useReferralOptions(): {
  referralOptions: ReferralOptions;
  allOptions: ReferralOptionGroup;
  loading: boolean;
  error: Error | null;
} {
  const { referralOptions, referralOptionsLoading, referralOptionsError } = useContext(Context);

  const allOptions = useMemo(
    () => ({ ...referralOptions.generic, ...referralOptions.partners }),
    [referralOptions.generic, referralOptions.partners],
  );

  return {
    referralOptions,
    allOptions,
    loading: referralOptionsLoading,
    error: referralOptionsError,
  };
}
