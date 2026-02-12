import { useContext, useEffect, useState } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { configEndpoint, header } from '../../apiCalls';
import { ConfigApiResponse, ConfigValue, FeatureFlags } from '../../Types/Config';
import { Config } from '../../Types/Config';
import { FormattedMessage } from 'react-intl';
import { ReactComponent as Student } from '../../Assets/icons/General/OptionCard/Conditions/student.svg';
import { ReactComponent as Pregnant } from '../../Assets/icons/General/OptionCard/Conditions/pregnant.svg';
import { ReactComponent as BlindOrVisuallyImpaired } from '../../Assets/icons/General/OptionCard/Conditions/blindOrVisuallyImpaired.svg';
import { ReactComponent as Disabled } from '../../Assets/icons/General/OptionCard/Conditions/disabled.svg';
import { ReactComponent as LongTermDisability } from '../../Assets/icons/General/OptionCard/Conditions/longTermDisability.svg';
import { ReactComponent as Chp } from '../../Assets/icons/General/OptionCard/HealthInsurance/chp.svg';
import { ReactComponent as DontKnow } from '../../Assets/icons/General/OptionCard/HealthInsurance/dont_know.svg';
import { ReactComponent as EmergencyMedicaid } from '../../Assets/icons/General/OptionCard/HealthInsurance/emergency_medicaid.svg';
import { ReactComponent as Employer } from '../../Assets/icons/General/OptionCard/HealthInsurance/employer.svg';
import { ReactComponent as FamilyPlanning } from '../../Assets/icons/UrgentNeeds/AcuteConditions/family_planning.svg';
import { ReactComponent as Medicaid } from '../../Assets/icons/General/OptionCard/HealthInsurance/medicaid.svg';
import { ReactComponent as Medicare } from '../../Assets/icons/General/OptionCard/HealthInsurance/medicare.svg';
import { ReactComponent as None } from '../../Assets/icons/General/OptionCard/HealthInsurance/none.svg';
import { ReactComponent as PrivateInsurance } from '../../Assets/icons/General/OptionCard/HealthInsurance/privateInsurance.svg';
import { ReactComponent as BabySupplies } from '../../Assets/icons/UrgentNeeds/AcuteConditions/baby_supplies.svg';
import { ReactComponent as ChildDevelopment } from '../../Assets/icons/UrgentNeeds/AcuteConditions/child_development.svg';
import { ReactComponent as YouthDevelopment } from '../../Assets/icons/UrgentNeeds/AcuteConditions/Youth_development.svg';
import { ReactComponent as DentalCare } from '../../Assets/icons/UrgentNeeds/AcuteConditions/dental_care.svg';
import { ReactComponent as Food } from '../../Assets/icons/UrgentNeeds/AcuteConditions/food.svg';
import { ReactComponent as Housing } from '../../Assets/icons/UrgentNeeds/AcuteConditions/housing.svg';
import { ReactComponent as JobResources } from '../../Assets/icons/UrgentNeeds/AcuteConditions/job_resources.svg';
import { ReactComponent as LegalServices } from '../../Assets/icons/UrgentNeeds/AcuteConditions/legal_services.svg';
import { ReactComponent as Support } from '../../Assets/icons/UrgentNeeds/AcuteConditions/support.svg';
import { ReactComponent as Military } from '../../Assets/icons/UrgentNeeds/AcuteConditions/military.svg';
import { ReactComponent as Resources } from '../../Assets/icons/General/resources.svg';
import { ReactComponent as SurvivingSpouse } from '../EnergyCalculator/Icons/Person.svg';
import { ReactComponent as Wheelchair } from '../EnergyCalculator/Icons/Wheelchair.svg';
import { ReactComponent as HeartRate } from '../EnergyCalculator/Icons/HeartRate.svg';
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
      iconComponent = <BabySupplies className={icon._classname} />;
      break;
    case 'Child_development':
      iconComponent = <ChildDevelopment className={icon._classname} />;
      break;
    case 'Youth_development':
      iconComponent = <YouthDevelopment className={icon._classname}  />;      
      break;    
    case 'Dental_care':
      iconComponent = <DentalCare className={icon._classname} />;
      break;
    case 'Food':
      iconComponent = <Food className={icon._classname} />;
      break;
    case 'Housing':
      iconComponent = <Housing className={icon._classname} />;
      break;
    case 'Job_resources':
      iconComponent = <JobResources className={icon._classname} />;
      break;
    case 'Legal_services':
      iconComponent = <LegalServices className={icon._classname} />;
      break;
    case 'Support':
      iconComponent = <Support className={icon._classname} />;
      break;
    case 'Military':
      iconComponent = <Military className={icon._classname} />;
      break;
    case 'Savings':
      iconComponent = <Resources className={icon._classname} />;
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
    // Health Insurance
    case 'Chp':
      iconComponent = <Chp className={icon._classname} />;
      break;
    case 'Dont_know':
      iconComponent = <DontKnow className={icon._classname} />;
      break;
    case 'Emergency_medicaid':
      iconComponent = <EmergencyMedicaid className={icon._classname} />;
      break;
    case 'Employer':
      iconComponent = <Employer className={icon._classname} />;
      break;
    case 'Family_planning':
      iconComponent = <FamilyPlanning className={icon._classname} />;
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
    case 'Wheelchair':
      iconComponent = <Wheelchair className={icon._classname} />;
      break;
    case 'HeartRate':
      iconComponent = <HeartRate className={icon._classname} />;
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

  // Extract feature flags from the first config item (same for all items in a WhiteLabel)
  const featureFlags = configData[0]?.feature_flags;
  if (featureFlags) {
    transformedConfig._feature_flags = featureFlags;
  }

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

    getConfig(whiteLabel)
      .then((value: ConfigApiResponse[]) => {
        // get data and set loading to false
        try {
          if (value !== undefined) {
            const transformedOutput: Config = transformConfigData(value);
            setConfigResponse(transformedOutput);
          } else {
            // Set empty config if value is undefined
            setConfigResponse({} as Config);
          }
        } catch (e) {
          console.error('Failed to transform config data:', e);
          // Set empty config on transformation error to prevent downstream crashes
          setConfigResponse({} as Config);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error(`Failed to load config for white label '${whiteLabel}':`, error);
        // Fallback to default config if white label config doesn't exist
        if (whiteLabel !== '_default') {
          console.log(`Falling back to _default config`);
          getConfig('_default')
            .then((value: ConfigApiResponse[]) => {
              try {
                if (value !== undefined) {
                  const transformedOutput: Config = transformConfigData(value);
                  setConfigResponse(transformedOutput);
                } else {
                  // Set empty config if value is undefined
                  setConfigResponse({} as Config);
                }
              } catch (e) {
                console.error('Failed to transform default config:', e);
                // Set empty config on transformation error to prevent downstream crashes
                setConfigResponse({} as Config);
              }
              setLoading(false);
            })
            .catch((err) => {
              console.error('Failed to load default config:', err);
              // Set empty config on fallback failure to prevent downstream crashes
              setConfigResponse({} as Config);
              setLoading(false);
            });
        } else {
          // Set empty config when already on _default and it fails
          setConfigResponse({} as Config);
          setLoading(false);
        }
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

export function useFeatureFlag(flag: string): boolean {
  const { config } = useContext(Context);
  return config?._feature_flags?.[flag] ?? false;
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
