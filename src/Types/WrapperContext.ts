import { FormData } from './FormData';
import { ITheme, ThemeName } from '../Assets/styleController';
import { ReferrerData, ReferrerDataValue } from '../Components/Referrer/referrerHook';
import { Language } from '../Assets/languageOptions';
import { Config } from './Config';

export interface WrapperContext {
  locale: Language;
  selectLanguage: (event: string) => void;
  formData: FormData;
  config: Config | undefined;
  configLoading: boolean;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  theme: ITheme;
  setTheme: React.Dispatch<React.SetStateAction<ThemeName>>;
  styleOverride: any;
  stepLoading: boolean;
  setStepLoading: (loading: boolean) => void;
  pageIsLoading: boolean;
  setScreenLoading: (loading: boolean) => void;
  getReferrer: <T extends keyof ReferrerData>(key: T, defaultValue?: ReferrerDataValue<T>) => ReferrerDataValue<T>;
  staffToken: string | undefined;
  setStaffToken: (token: string | undefined) => void;
  whiteLabel: string;
  setWhiteLabel: (whiteLabel: string) => void;
}
