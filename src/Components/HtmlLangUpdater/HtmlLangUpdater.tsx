import { useContext, useEffect } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { useConfig } from '../Config/configHook';

/**
 * This component updates the 'lang' attribute on the HTML
 * element to prevent Google Translate from overriding our
 * translations, but only for languages the white label offers.
 */
export const HtmlLangUpdater = () => {
  const { locale } = useContext(Context);
  const languageOptions = useConfig<Record<string, string>>('language_options', {});

  useEffect(() => {
    const htmlLang = locale.slice(0, 2);
    document.documentElement.setAttribute('lang', htmlLang);

    if (htmlLang !== 'en') {
      const supportedLanguageCodes = Object.keys(languageOptions).map((code) => code.slice(0, 2));

      if (supportedLanguageCodes.includes(htmlLang)) {
        document.documentElement.setAttribute('translate', 'no');
      } else {
        document.documentElement.removeAttribute('translate');
      }
    } else {
      document.documentElement.removeAttribute('translate');
    }
  }, [locale, languageOptions]);

  return null;
};
