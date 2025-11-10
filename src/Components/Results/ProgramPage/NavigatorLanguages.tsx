import { FormattedMessage } from 'react-intl';
import { Language } from '../../../Assets/languageOptions';
import { FormattedMessageType } from '../../../Types/Questions';

export const allNavigatorLanguages: Record<Language, FormattedMessageType> & Record<'ALL', FormattedMessageType> = {
  'en-us': <FormattedMessage id="navLanguage.en-us" defaultMessage="English Available" />,
  es: <FormattedMessage id="navLanguage.es" defaultMessage="Spanish Available" />,
  vi: <FormattedMessage id="navLanguage.vi" defaultMessage="Vietnamese Available" />,
  fr: <FormattedMessage id="navLanguage.fr" defaultMessage="French Available" />,
  am: <FormattedMessage id="navLanguage.am" defaultMessage="Amharic Available" />,
  so: <FormattedMessage id="navLanguage.so" defaultMessage="Somali Available" />,
  ru: <FormattedMessage id="navLanguage.ru" defaultMessage="Russian Available" />,
  ne: <FormattedMessage id="navLanguage.ne" defaultMessage="Nepali Available" />,
  my: <FormattedMessage id="navLanguage.my" defaultMessage="Burmese Available" />,
  zh: <FormattedMessage id="navLanguage.zh" defaultMessage="Chinese Available" />,
  ar: <FormattedMessage id="navLanguage.ar" defaultMessage="Arabic Available" />,
  sw: <FormattedMessage id="navLanguage.sw" defaultMessage="Swahili Available" />,
  pl: <FormattedMessage id="navLanguage.pl" defaultMessage="Polish Available" />,
  tl: <FormattedMessage id="navLanguage.tl" defaultMessage="Tagalog Available" />,
  ko: <FormattedMessage id="navLanguage.ko" defaultMessage="Korean Available" />,
  ur: <FormattedMessage id="navLanguage.ur" defaultMessage="Urdu Available" />,
  'pt-br': <FormattedMessage id="navLanguage.pt-br" defaultMessage="Portuguese Available" />,
  ht: <FormattedMessage id="navLanguage.ht" defaultMessage="Haitian Creole Available" />,
  ALL: <FormattedMessage id="navLanguage.ALL" defaultMessage="All Languages Available" />,
};
