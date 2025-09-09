import React, { useEffect, useState, PropsWithChildren } from 'react';
import useStyle from '../../Assets/styleController';
import { IntlProvider } from 'react-intl';
import { WrapperContext } from '../../Types/WrapperContext';
import { FormData } from '../../Types/FormData';
import { getTranslations } from '../../apiCalls';
import useReferrer, { ReferrerData } from '../Referrer/referrerHook';
import { useGetConfig } from '../Config/configHook';
import { rightToLeftLanguages, Language } from '../../Assets/languageOptions';
import { HtmlLangUpdater } from '../HtmlLangUpdater/HtmlLangUpdater';

const initialFormData: FormData = {
  isTest: false,
  frozen: false,
  externalID: undefined,
  agreeToTermsOfService: false,
  is13OrOlder: false,
  zipcode: '',
  county: '',
  startTime: new Date().toJSON(),
  hasExpenses: 'false',
  expenses: [],
  householdSize: 0,
  householdData: [],
  householdAssets: 0,
  hasBenefits: 'preferNotToAnswer',
  benefits: {
    acp: false,
    andcs: false,
    cccap: false,
    coctc: false,
    coeitc: false,
    coheadstart: false,
    coPropTaxRentHeatCreditRebate: false,
    ctc: false,
    dentallowincseniors: false,
    denverpresc: false,
    ede: false,
    eitc: false,
    lifeline: false,
    leap: false,
    mydenver: false,
    nslp: false,
    oap: false,
    pell: false,
    rtdlive: false,
    snap: false,
    ssdi: false,
    ssi: false,
    cowap: false,
    ubp: false,
    tanf: false,
    upk: false,
    wic: false,
    nfp: false,
    fatc: false,
  },
  referralSource: undefined,
  immutableReferrer: undefined,
  signUpInfo: {
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    hasUser: false,
    sendOffers: false,
    sendUpdates: false,
    emailConsent: false,
    commConsent: false,
  },
  urlSearchParams: '',
  acuteHHConditions: {
    food: false,
    babySupplies: false,
    housing: false,
    support: false,
    childDevelopment: false,
    familyPlanning: false,
    jobResources: false,
    dentalCare: false,
    legalServices: false,
  },
};

export const DEFAULT_WHITE_LABEL = '_default';

export const Context = React.createContext<WrapperContext>({} as WrapperContext);

const Wrapper = (props: PropsWithChildren<{}>) => {
  const [staffToken, setStaffToken] = useState<string | undefined>(undefined);

  const [translationsLoading, setTranslationsLoading] = useState<boolean>(true);
  const [screenLoading, setScreenLoading] = useState<boolean>(true);
  const [pageIsLoading, setPageIsLoading] = useState<boolean>(true);
  const [stepLoading, setStepLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [whiteLabel, setWhiteLabel] = useState(DEFAULT_WHITE_LABEL);

  const { configLoading, configResponse: config } = useGetConfig(screenLoading, whiteLabel);
  const { language_options: languageOptions = {} } = config ?? {};
  const languages = Object.keys(languageOptions) as Language[];
  const { referrer_data: referrerData = undefined } = config ?? {};

  const { getReferrer, setReferrer } = useReferrer(formData.immutableReferrer, referrerData as ReferrerData);

  useEffect(() => {
    setReferrer(formData.immutableReferrer);
  }, [formData.immutableReferrer]);

  useEffect(() => {
    if (!screenLoading && !translationsLoading && !configLoading) {
      setPageIsLoading(false);
      return;
    }

    setPageIsLoading(true);
  }, [screenLoading, translationsLoading, configLoading]);

  let [translations, setTranslations] = useState<{ Language: { [key: string]: string } } | {}>({});

  const initializeLocale = () => {
    let defaultLanguage = localStorage.getItem('language') as Language;

    const userLanguage = navigator.language.toLowerCase() as Language;

    const verifyLanguage = (language: Language) => {
      return Object.keys(languageOptions).some((lang) => language.slice(0, 2) === lang)
        ? language.slice(0, 2)
        : 'en-us';
    };

    defaultLanguage = defaultLanguage ? defaultLanguage : (verifyLanguage(userLanguage) as Language);

    const pathname = window.location.pathname;

    languages.forEach((lang: Language) => {
      if (pathname.includes(`/${lang}/`)) {
        defaultLanguage = lang;
      }
    });

    return defaultLanguage;
  };

  const [theme, setTheme, styleOverride] = useStyle('default');
  const [locale, setLocale] = useState<Language>(initializeLocale);
  const [messages, setMessages] = useState({});

  useEffect(() => {
    if (locale in translations) {
      return;
    }

    setTranslationsLoading(true);
    getTranslations(locale).then((value) => {
      setTranslations((translations) => {
        return { ...translations, ...value };
      });
    });
  }, [locale]);

  useEffect(() => {
    localStorage.setItem('language', locale);

    if (!(locale in translations)) {
      setMessages({});
      return;
    }
    setTranslationsLoading(false);

    for (const lang of Object.keys(translations) as Language[]) {
      if (locale.toLocaleLowerCase() === lang) {
        // @ts-ignore
        setMessages(translations[lang]);
        return;
      }
    }
    // @ts-ignore
    setMessages(translations['en-us'] ?? {});
  }, [locale, translations]);

  useEffect(() => {
    if (rightToLeftLanguages.includes(locale)) {
      document.documentElement.setAttribute('dir', 'rtl');
      return;
    }

    document.documentElement.removeAttribute('dir');
  }, [locale]);

  useEffect(() => {
    if (!referrerData) return;
    const defaultLanguage = getReferrer('defaultLanguage', 'en-us');
    
    if (defaultLanguage !== 'en-us') {
      setLocale(defaultLanguage as Language);
    }
  }, [referrerData]);

  const selectLanguage = (newLocale: string) => {
    if (languages.every((lang) => lang !== newLocale)) {
      setLocale('en-us');
      return;
    }

    setLocale(newLocale as Language);
  };

  return (
    <Context.Provider
      value={{
        locale,
        selectLanguage,
        config,
        configLoading,
        formData,
        setFormData,
        theme,
        setTheme,
        styleOverride,
        pageIsLoading,
        setScreenLoading,
        stepLoading,
        setStepLoading,
        staffToken,
        setStaffToken,
        getReferrer,
        whiteLabel,
        setWhiteLabel,
      }}
    >
      <IntlProvider locale={locale} messages={messages} defaultLocale={locale}>
        <HtmlLangUpdater />
        {props.children}
      </IntlProvider>
    </Context.Provider>
  );
};

export default Wrapper;
