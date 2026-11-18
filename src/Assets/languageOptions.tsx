import { Language } from '@mui/icons-material';
import { englishToNepaliNumber } from 'nepali-number';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../Components/Config/configHook';
import { Context } from '../Components/Wrapper/Wrapper';
import { FormattedMessageType } from '../Types/Questions';

/**
 * A site locale code. The ones a white label offers come from benefits-api (`language_options`, from
 * `settings.LANGUAGES`), so the screener keeps no list of its own.
 */
export type Language = string;

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
