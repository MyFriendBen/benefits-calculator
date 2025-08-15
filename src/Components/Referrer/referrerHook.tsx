import { useState } from 'react';
import { FormattedMessageType, QuestionName } from '../../Types/Questions';

type ReferrerOptions<T> = {
  default: T;
  [key: string]: T | undefined;
};

export type StepDirectory = QuestionName[] | { default: QuestionName[]; [key: string]: QuestionName[] };

export type ReferrerData = {
  theme: ReferrerOptions<string>;
  logoSource: ReferrerOptions<string>;
  faviconSource: ReferrerOptions<string>;
  logoAlt: ReferrerOptions<{ id: string; defaultMessage: string }>;
  logoFooterSource: ReferrerOptions<string>;
  logoFooterAlt: ReferrerOptions<{ id: string; defaultMessage: string }>;
  logoClass: ReferrerOptions<string>;
  footerLogoClass: ReferrerOptions<string>;
  shareLink: ReferrerOptions<string>;
  featureFlags: ReferrerOptions<string[]>;
  stepDirectory: ReferrerOptions<StepDirectory>;
  noResultMessage: ReferrerOptions<FormattedMessageType>;
  defaultLanguage: ReferrerOptions<string>;
};

export type ReferrerDataValue<T extends keyof ReferrerData> = T extends
  | 'theme'
  | 'logoSource'
  | 'faviconSource'
  | 'logoFooterSource'
  | 'footerLogoClass'
  | 'logoClass'
  | 'shareLink'
  | 'defaultLanguage'
  ? string
  : T extends 'logoAlt' | 'logoFooterAlt'
  ? { id: string; defaultMessage: string }
  : T extends 'stepDirectory'
  ? StepDirectory
  : T extends 'featureFlags'
  ? string[]
  : T extends 'noResultMessage'
  ? FormattedMessageType
  : never;

export default function useReferrer(referrerCode?: string, referrerData?: ReferrerData) {
  const [referrer, setReferrer] = useState<string | undefined>(referrerCode);

  function getReferrer<T extends keyof ReferrerData>(
    key: T,
    defaultValue?: ReferrerDataValue<T>,
  ): ReferrerDataValue<T> {
    if (referrerData === undefined) {
      if (defaultValue !== undefined) return defaultValue;

      throw new Error('referrerData is not loaded yet. Consider adding a default value.');
    }

    if (referrerData[key] === undefined) {
      if (defaultValue !== undefined) return defaultValue;

      throw new Error(`${key} is not in referrerData`);
    }

    return (referrerData[key][referrer ?? 'default'] ?? referrerData[key].default) as ReferrerDataValue<T>;
  }

  return { getReferrer, setReferrer };
}
