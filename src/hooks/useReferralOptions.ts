import { useContext, useMemo } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';

export type ReferralOptionGroup = Record<string, string>;

export interface ReferralOptions {
  generic: ReferralOptionGroup;
  partners: ReferralOptionGroup;
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
