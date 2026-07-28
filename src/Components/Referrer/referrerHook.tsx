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
  uiOptions: ReferrerOptions<string[]>;
  stepDirectory: ReferrerOptions<StepDirectory>;
  noResultMessage: ReferrerOptions<FormattedMessageType>;
  defaultLanguage: ReferrerOptions<string>;
  stateName: ReferrerOptions<string>;
};

export type ReferrerDataValue = keyof ReferrerOptions<keyof ReferrerData>

export default function useReferrer(referrerCode?: string, referrerData?: ReferrerData) {
  const [referrer, setReferrer] = useState<string | undefined>(referrerCode);

  function getReferrer<T extends keyof ReferrerData>(
    key: T,
    defaultValue?: ReferrerDataValue,
  ): ReferrerDataValue {
    if (referrerData === undefined) {
      if (defaultValue !== undefined) return defaultValue;

      throw new Error('referrerData is not loaded yet. Consider adding a default value.');
    }

    if (referrerData[key] === undefined) {
      if (defaultValue !== undefined) return defaultValue;

      throw new Error(`${key} is not in referrerData`);
    }

    return (referrerData[key][referrer ?? 'default'] ?? referrerData[key].default) as ReferrerDataValue;
  }

  return { getReferrer, setReferrer };
}
