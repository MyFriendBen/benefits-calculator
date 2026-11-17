import { Language } from '@mui/icons-material';
import { englishToNepaliNumber } from 'nepali-number';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../Components/Config/configHook';
import { Context } from '../Components/Wrapper/Wrapper';
import { FormattedMessageType } from '../Types/Questions';

/**
 * Every language the site can be shown in. benefits-api's `settings.LANGUAGES` is the source, and
 * each white label serves the ones it offers as `language_options`; this list exists for the type,
 * and `Components/Config/apiServedLists.test.ts` pins it to the API's.
 */
export const LANGUAGES = [
  'en-us',
  'es',
  'vi',
  'fr',
  'am',
  'so',
  'ru',
  'ne',
  'my',
  'zh-hans',
  'ar',
  'sw',
  'pl',
  'tl',
  'ko',
  'ur',
  'pt-br',
  'ht',
] as const;
export type Language = (typeof LANGUAGES)[number];

export const rightToLeftLanguages = ['ar', 'ur'];

export function translateNumber(number: number | string, locale: Language) {
  if (locale === 'ne') {
    return englishToNepaliNumber(number);
  }

  return String(number);
}

// translate numbers. Currently only used for Nepali numbers. Will work with dollar values as well.
export function useTranslateNumber() {
  const { locale } = useContext(Context);

  return (number: number | string) => {
    return translateNumber(number, locale);
  };
}

type OverrideableTranslationProps = {
  id: string;
  defaultMessage: string;
};
export function OverrideableTranslation({ id, defaultMessage }: OverrideableTranslationProps) {
  const overrides = useConfig<{ [key: string]: FormattedMessageType }>('override_text');

  if (id in overrides) {
    return overrides[id];
  }

  return <FormattedMessage id={id} defaultMessage={defaultMessage} />;
}
