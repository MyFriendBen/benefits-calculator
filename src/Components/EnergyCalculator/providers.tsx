import { useContext, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { FormattedMessageType } from '../../Types/Questions';
import { Context } from '../Wrapper/Wrapper';

// Provider constants for heat pump rebate logic
export const XCEL_PROVIDER = 'co-xcel-energy';
export const EFFICIENCY_WORKS_PROVIDERS = [
  'co-fort-collins-utilities',
  'co-loveland-water-and-power',
  'co-longmont-power-and-communications',
  'co-estes-park-power-and-communications',
];

export const OTHER_ELECTRIC_PROVIDERS: { [key: string]: FormattedMessageType } = {
  other: <FormattedMessage id="energyCalculator.electricityProvider.other" defaultMessage="Other" />,
  none: <FormattedMessage id="energyCalculator.electricityProvider.none" defaultMessage="None / Don't Pay" />,
};

export const OTHER_GAS_PROVIDERS: { [key: string]: FormattedMessageType } = {
  propane: (
    <FormattedMessage
      id="energyCalculator.gasProvider.propane"
      defaultMessage="Propane tank / firewood / heating pellets"
    />
  ),
  other: <FormattedMessage id="energyCalculator.gasProvider.other" defaultMessage="Other" />,
  none: <FormattedMessage id="energyCalculator.gasProvider.none" defaultMessage="None / Don't Pay" />,
};

type Providers = Record<'gas' | 'electric', { [key: string]: string }>;

async function getUtilityProviders(zipCode: string) {
  const API_KEY = `Bearer ${process.env.REACT_APP_ENERGY_CALCULATOR_REWIRING_AMERICA_API_KEY}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: API_KEY,
    },
  };

  const response = await fetch(`https://api.rewiringamerica.org/api/v1/utilities?zip=${zipCode}&language=en`, options);

  const data = await response.json();

  const providers: Providers = { gas: {}, electric: {} };

  for (const [providerCode, apiMapping] of [
    ['gas', 'gas_utilities'],
    ['electric', 'utilities'],
  ] as const) {
    for (const [code, details] of Object.entries<any>(data[apiMapping])) {
      providers[providerCode][code] = details.name;
    }
  }

  return providers;
}

export function useUtilityProviders() {
  const [providers, setProviders] = useState<Providers | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const { formData } = useContext(Context);

  useEffect(() => {
    if (formData.zipcode === undefined) {
      setProviders(undefined);
      setHasError(true);
    }

    setProviders(undefined);
    setHasError(false);

    getUtilityProviders(formData.zipcode)
      .then((value) => {
        setProviders(value);
        setHasError(false);
      })
      .catch(() => {
        setHasError(true);
      });
  }, [formData.zipcode]);

  return { providers, hasError };
}
