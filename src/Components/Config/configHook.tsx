import { useContext, useEffect, useState } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { configEndpoint, header } from '../../apiCalls';
import { ConfigApiResponse, ConfigValue } from '../../Types/Config';
import { Config } from '../../Types/Config';
import { FormattedMessage } from 'react-intl';
import { ReactComponent as Student } from '../../Assets/icons/General/OptionCard/Conditions/student.svg';
import { ReactComponent as Pregnant } from '../../Assets/icons/General/OptionCard/Conditions/pregnant.svg';
import { ReactComponent as BlindOrVisuallyImpaired } from '../../Assets/icons/General/OptionCard/Conditions/blindOrVisuallyImpaired.svg';
import { ReactComponent as Disabled } from '../../Assets/icons/General/OptionCard/Conditions/disabled.svg';
import { ReactComponent as LongTermDisability } from '../../Assets/icons/General/OptionCard/Conditions/longTermDisability.svg';
import { ReactComponent as Chp } from '../../Assets/icons/General/OptionCard/HealthInsurance/chp.svg';
import { ReactComponent as Dont_know } from '../../Assets/icons/General/OptionCard/HealthInsurance/dont_know.svg';
import { ReactComponent as Emergency_medicaid } from '../../Assets/icons/General/OptionCard/HealthInsurance/emergency_medicaid.svg';
import { ReactComponent as Employer } from '../../Assets/icons/General/OptionCard/HealthInsurance/employer.svg';
import { ReactComponent as Family_planning } from '../../Assets/icons/UrgentNeeds/AcuteConditions/family_planning.svg';
import { ReactComponent as Medicaid } from '../../Assets/icons/General/OptionCard/HealthInsurance/medicaid.svg';
import { ReactComponent as Medicare } from '../../Assets/icons/General/OptionCard/HealthInsurance/medicare.svg';
import { ReactComponent as None } from '../../Assets/icons/General/OptionCard/HealthInsurance/none.svg';
import { ReactComponent as PrivateInsurance } from '../../Assets/icons/General/OptionCard/HealthInsurance/privateInsurance.svg';
import { ReactComponent as Baby_supplies } from '../../Assets/icons/UrgentNeeds/AcuteConditions/baby_supplies.svg';
import { ReactComponent as Child_development } from '../../Assets/icons/UrgentNeeds/AcuteConditions/child_development.svg';
import { ReactComponent as Dental_care } from '../../Assets/icons/UrgentNeeds/AcuteConditions/dental_care.svg';
import { ReactComponent as Food } from '../../Assets/icons/UrgentNeeds/AcuteConditions/food.svg';
import { ReactComponent as Housing } from '../../Assets/icons/UrgentNeeds/AcuteConditions/housing.svg';
import { ReactComponent as Job_resources } from '../../Assets/icons/UrgentNeeds/AcuteConditions/job_resources.svg';
import { ReactComponent as Legal_services } from '../../Assets/icons/UrgentNeeds/AcuteConditions/legal_services.svg';
import { ReactComponent as Support } from '../../Assets/icons/UrgentNeeds/AcuteConditions/support.svg';
import { ReactComponent as Military } from '../../Assets/icons/UrgentNeeds/AcuteConditions/military.svg';
import { ReactComponent as SurvivingSpouse } from '../../Assets/icons/General/head.svg';
import { ReactComponent as Dialysis } from '../../Assets/icons/General/OptionCard/Conditions/dialysis.svg';
import { Language } from '../../Assets/languageOptions';

type Item = {
  _label: string;
  _default_message: string;
};

type IconItem = {
  _classname: string;
  _icon: string;
};

// Transforms objects with icon key to return Icon ReactComponent
function transformItemIcon(item: unknown): any {
  const icon = item as IconItem;

  let iconComponent;
  switch (icon._icon) {
    // Acute Conditions
    case 'Baby_supplies':
      iconComponent = <Baby_supplies className={icon._classname} />;
      break;
    case 'Child_development':
      iconComponent = <Child_development className={icon._classname} />;
      break;
    case 'Dental_care':
      iconComponent = <Dental_care className={icon._classname} />;
      break;
    case 'Food':
      iconComponent = <Food className={icon._classname} />;
      break;
    case 'Housing':
      iconComponent = <Housing className={icon._classname} />;
      break;
    case 'Job_resources':
      iconComponent = <Job_resources className={icon._classname} />;
      break;
    case 'Legal_services':
      iconComponent = <Legal_services className={icon._classname} />;
      break;
    case 'Support':
      iconComponent = <Support className={icon._classname} />;
      break;
    case 'Military':
      iconComponent = <Military className={icon._classname} />;
      break;
    // Conditions
    case 'BlindOrVisuallyImpaired':
      iconComponent = <BlindOrVisuallyImpaired className={icon._classname} />;
      break;
    case 'Disabled':
      iconComponent = <Disabled className={icon._classname} />;
      break;
    case 'LongTermDisability':
      iconComponent = <LongTermDisability className={icon._classname} />;
      break;
    case 'Pregnant':
      iconComponent = <Pregnant className={icon._classname} />;
      break;
    case 'Student':
      iconComponent = <Student className={icon._classname} />;
      break;
    case 'Dialysis':
      iconComponent = <Dialysis className={icon._classname} />;
      break;
    // Health Insurance
    case 'Chp':
      iconComponent = <Chp className={icon._classname} />;
      break;
    case 'Dont_know':
      iconComponent = <Dont_know className={icon._classname} />;
      break;
    case 'Emergency_medicaid':
      iconComponent = <Emergency_medicaid className={icon._classname} />;
      break;
    case 'Employer':
      iconComponent = <Employer className={icon._classname} />;
      break;
    case 'Family_planning':
      iconComponent = <Family_planning className={icon._classname} />;
      break;
    case 'Medicaid':
      iconComponent = <Medicaid className={icon._classname} />;
      break;
    case 'Medicare':
      iconComponent = <Medicare className={icon._classname} />;
      break;
    case 'None':
      iconComponent = <None className={icon._classname} />;
      break;
    case 'PrivateInsurance':
      iconComponent = <PrivateInsurance className={icon._classname} />;
      break;
    case 'SurvivingSpouse':
      iconComponent = <SurvivingSpouse className={icon._classname} />;
      break;
    // Needs a generic catch-all
    default:
      iconComponent = <LongTermDisability className="option-card-icon" />;
      break;
  }

  return iconComponent;
}

// Recursively transform any object that has _label && _default_message as keys into a FormattedMessage
// and convert icon object into ReactComponent
function transformItem(item: unknown): any {
  if (typeof item !== 'object' || item === null) return item;

  if (item.hasOwnProperty('_label') && item.hasOwnProperty('_default_message')) {
    const { _label, _default_message } = item as Item;
    return <FormattedMessage id={_label} defaultMessage={_default_message} />;
  }

  if (item.hasOwnProperty('_icon') && item.hasOwnProperty('_classname')) {
    const iconItem = transformItemIcon(item);

    return iconItem;
  }

  if (Array.isArray(item)) {
    const array: ConfigValue[] = [];

    for (const value of item) {
      array.push(transformItem(value));
    }

    return array;
  }

  const config: Config = {};
  for (const key in item) {
    if (item.hasOwnProperty(key)) {
      config[key] = transformItem((item as any)[key]);
    }
  }

  return config;
}

function transformConfigData(configData: ConfigApiResponse[]): Config {
  const transformedConfig: Config = {};

  configData.forEach((item) => {
    const { name, data } = item;
    const configOptions = data;

    transformedConfig[name] = transformItem(configOptions);
  });

  return transformedConfig;
}

async function getConfig(whiteLabel: string) {
  // fetch data
  return fetch(configEndpoint + whiteLabel + '/', {
    method: 'GET',
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json().then((val) => {
      return val.map((config: any) => {
        return { ...config, data: JSON.parse(config.data) };
      });
    });
  });
}

export function useGetConfig(screenLoading: boolean, whiteLabel: string) {
  const [configLoading, setLoading] = useState<boolean>(true);
  const [configResponse, setConfigResponse] = useState<Config | undefined>();

  useEffect(() => {
    setLoading(true);
    if (screenLoading) {
      return;
    }

    getConfig(whiteLabel).then((value: ConfigApiResponse[]) => {
      // get data and set loading to false
      try {
        if (value !== undefined) {
          const transformedOutput: Config = transformConfigData(value);
          setConfigResponse(transformedOutput);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    });
  }, [screenLoading, whiteLabel]);

  return { configLoading, configResponse };
}

export function useConfig<T>(name: string, defaultValue?: T): T {
  const { config } = useContext(Context);

  if (config === undefined || config[name] === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(
      `'${name}' does not exist in the config. Consider using a default value if useConfig is used before the config is loaded.`,
    );
  }

  return config[name] as T;
}

export function useLocalizedLink(configKey: 'privacy_policy' | 'consent_to_contact') {
  const { locale } = useContext(Context);
  const links = useConfig<Partial<Record<Language, string>>>(configKey, {});

  // Fallback URLs if not found in config
  const fallbackUrls = {
    privacy_policy: 'https://www.myfriendben.org/privacy-policy/',
    consent_to_contact: 'https://www.myfriendben.org/terms-and-conditions/',
  };

  return links[locale] ?? links['en-us'] ?? fallbackUrls[configKey] ?? '';
}
