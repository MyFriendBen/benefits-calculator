import { useContext, useEffect, useState } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { configEndpoint, header } from '../../apiCalls';
import { ConfigApiResponse, ConfigValue, FeatureFlags } from '../../Types/Config';
import { Config } from '../../Types/Config';
import { FormattedMessage } from 'react-intl';
import { ReactComponent as SurvivingSpouse } from '../EnergyCalculator/Icons/Person.svg';
import { ReactComponent as Wheelchair } from '../EnergyCalculator/Icons/Wheelchair.svg';
import { ReactComponent as HeartRate } from '../EnergyCalculator/Icons/HeartRate.svg';
import { Language } from '../../Assets/languageOptions';
import { Icon } from '../Icon/Icon';

const OPTION_CARD_ICON_MAP: Record<string, string> = {
  // Health Insurance
  None: 'ban',
  Employer: 'briefcase',
  PrivateInsurance: 'circle-user-round',
  Medicaid: 'heart-pulse',
  Medicare: 'stethoscope',
  Chp: 'baby',
  Emergency_medicaid: 'ambulance',
  Family_planning: 'heart-handshake',
  VA: 'shield-plus',
  // Conditions
  Student: 'graduation-cap',
  Pregnant: 'sprout',
  BlindOrVisuallyImpaired: 'glasses',
  Disabled: 'accessibility',
  LongTermDisability: 'calendar-clock',
  // Acute needs
  Food: 'apple',
  Baby_supplies: 'baby',
  Housing: 'house',
  Support: 'messages-square',
  Child_development: 'shapes',
  Job_resources: 'briefcase-business',
  Dental_care: 'smile',
  Legal_services: 'scale',
  Savings: 'piggy-bank',
  Military: 'shield',
  Aging: 'circle-dot', // placeholder — mapping pending
  Youth_development: 'circle-dot', // placeholder — mapping pending
};


type Item = {
  _label: string;
  _default_message: string;
};

type IconItem = {
  _classname: string;
  _icon: string;
};

// Transforms objects with icon key to return a Lucide Icon component.
// EnergyCalculator-specific icons (SurvivingSpouse, Wheelchair, HeartRate) retain their
// custom SVG components since they are outside the scope of the Lucide migration.
function transformItemIcon(item: unknown): any {
  const icon = item as IconItem;

  switch (icon._icon) {
    case 'SurvivingSpouse':
      return <SurvivingSpouse className={icon._classname} />;
    case 'Wheelchair':
      return <Wheelchair className={icon._classname} />;
    case 'HeartRate':
      return <HeartRate className={icon._classname} />;
    default: {
      const lucideName = OPTION_CARD_ICON_MAP[icon._icon] ?? 'circle-dot';
      return <Icon name={lucideName} className="option-card-lucide-icon" />;
    }
  }
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

  const mergedFlags: FeatureFlags = {};
  for (const item of configData) {
    if (item.feature_flags) {
      // Warn in development if a flag is being overridden
      if (process.env.NODE_ENV === 'development') {
        for (const [key, value] of Object.entries(item.feature_flags)) {
          if (key in mergedFlags && mergedFlags[key] !== value) {
            console.warn(
              `Feature flag '${key}' is defined in multiple config items with different values. ` +
              `Previous: ${mergedFlags[key]}, Current: ${value}. Using current value from config '${item.name}'.`
            );
          }
        }
      }
      Object.assign(mergedFlags, item.feature_flags);
    }
  }
  if (Object.keys(mergedFlags).length > 0) {
    transformedConfig._feature_flags = mergedFlags;
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
