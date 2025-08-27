import { Language } from '@mui/icons-material';
import { englishToNepaliNumber } from 'nepali-number';
import { ReactNode, useContext, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../Components/Config/configHook';
import { Context } from '../Components/Wrapper/Wrapper';
import { FormattedMessageType } from '../Types/Questions';

export type Language = 'en-us' | 'es' | 'vi' | 'fr' | 'am' | 'so' | 'ru' | 'ne' | 'my' | 'zh' | 'ar' | 'sw' | 'pl' | 'tl' | 'ko' | 'ur';
export const LANGUAGE_OPTIONS: Record<Language, string> = {
  'en-us': 'English',
  es: 'Español',
  vi: 'Tiếng Việt',
  fr: 'Français',
  am: 'አማርኛ',
  so: 'Soomaali',
  ru: 'Русский',
  ne: 'नेपाली',
  my: 'မြန်မာဘာသာစကား',
  zh: '中文',
  ar: 'عربي',
  sw: 'Kiswahili',
  pl: 'Polski',
  tl: 'Tagalog',
  ko: '한국어',
  ur: 'اردو',
};

export const rightToLeftLanguages = ['ar', 'ur'];

// Reorder a list of elements based on the selected locale. A key might need to be added to the FormattedMessage.
export function useReorderLanguage(text: ReactNode[], order: { [key in Language]?: number[] }) {
  const { locale } = useContext(Context);

  return useMemo(() => {
    const localeOrder = order[locale];
    if (localeOrder === undefined) {
      return text;
    }

    const localeText = [];
    for (const index of localeOrder) {
      localeText.push(text[index]);
    }

    return localeText;
  }, [locale, order]);
}

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

export default LANGUAGE_OPTIONS;
