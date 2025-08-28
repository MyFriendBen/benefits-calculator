// NOTE: source: https://github.com/rewiringamerica/embed.rewiringamerica.org/blob/main/src/api/calculator-types-v1.ts
import { FormattedMessage } from 'react-intl';
import { FormattedMessageType } from '../../../Types/Questions';
import TrackedOutboundLink from '../../Common/TrackedOutboundLink/TrackedOutboundLink';

export type EnergyCalculatorIncentiveType =
  | 'tax_credit'
  | 'pos_rebate'
  | 'rebate'
  | 'account_credit'
  | 'performance_rebate';
export type EnergyCalculatorAuthorityType = 'federal' | 'state' | 'utility' | 'city' | 'county' | 'other';

export type EnergyCalculatorAmountType = 'dollar_amount' | 'percent' | 'dollars_per_unit';
export type EnergyCalculatorAmountUnit = 'ton' | 'kilowatt' | 'watt' | 'btuh10k' | 'square_foot' | 'kilowatt_hour';
export interface EnergyCalculatorAmount {
  type: EnergyCalculatorAmountType;
  number: number;
  maximum?: number;
  representative?: number;
  unit?: EnergyCalculatorAmountUnit;
}

export const ENERGY_CALCULATOR_ITEMS = [
  // hvac
  'air_to_water_heat_pump',
  'central_air_conditioner',
  'ducted_heat_pump',
  'ductless_heat_pump',
  'geothermal_heating_installation',
  'other_heat_pump',
  // water heater
  'heat_pump_water_heater',
  'non_heat_pump_water_heater',
  // stove
  'electric_stove',
] as const;

export type EnergyCalculatorItemType = (typeof ENERGY_CALCULATOR_ITEMS)[number];

export interface EnergyCalculatorIncentive {
  payment_methods: EnergyCalculatorIncentiveType[];
  authority_type: EnergyCalculatorAuthorityType;
  authority_name: string | null;
  program: string;
  program_url: string;
  more_info_url?: string;
  items: EnergyCalculatorItemType[];
  amount: EnergyCalculatorAmount;
  start_date?: string;
  end_date?: string;
  short_description?: string;

  eligible?: boolean;
}

export interface EnergyCalculatorAPILocation {
  state: string;
}

export interface EnergyCalculatorAPIUtilityMap {
  [utilityId: string]: {
    name: string;
  };
}

export interface EnergyCalculatorAPIUtilitiesResponse {
  location: EnergyCalculatorAPILocation;
  utilities: EnergyCalculatorAPIUtilityMap;
  gas_utilities?: EnergyCalculatorAPIUtilityMap;
  gas_utility_affects_incentives?: boolean;
}

export interface EnergyCalculatorAPIResponse {
  authorities: {
    [authorityId: string]: {
      name: string;
      logo?: {
        src: string;
        width: number;
        height: number;
      };
    };
  };
  coverage: {
    state: string | null;
    utility: string | null;
  };
  data_partners: {
    [id: string]: {
      name: string;
      logo?: {
        src: string;
        width: number;
        height: number;
      };
    };
  };
  location: EnergyCalculatorAPILocation;
  incentives: EnergyCalculatorIncentive[];
  is_under_80_ami: boolean;
  is_under_150_ami: boolean;
}

export type EnergyCalculatorRebate = EnergyCalculatorIncentive;

export type EnergyCalculatorRebateCategoryType = 'hvac' | 'waterHeater' | 'stove';

export const ENERGY_CALCULATOR_CATEGORY_MAP: Record<EnergyCalculatorItemType, EnergyCalculatorRebateCategoryType> = {
  air_to_water_heat_pump: 'hvac',
  central_air_conditioner: 'hvac',
  ducted_heat_pump: 'hvac',
  ductless_heat_pump: 'hvac',
  geothermal_heating_installation: 'hvac',
  other_heat_pump: 'hvac',
  heat_pump_water_heater: 'waterHeater',
  non_heat_pump_water_heater: 'waterHeater',
  electric_stove: 'stove',
};

export const ENERGY_CALCULATOR_CATEGORY_TITLE_MAP: Record<EnergyCalculatorRebateCategoryType, FormattedMessageType> = {
  hvac: (
    <FormattedMessage
      id="energyCalculator.results.category.hvac.title"
      defaultMessage="Heating, Ventilation & Cooling"
    />
  ),
  waterHeater: (
    <FormattedMessage id="energyCalculator.results.category.waterHeater.title" defaultMessage="Water Heater" />
  ),
  stove: <FormattedMessage id="energyCalculator.results.category.stove.title" defaultMessage="Cooking Stove/Range" />,
};

export type EnergyCalculatorRebateCategory = {
  type: EnergyCalculatorRebateCategoryType;
  name: FormattedMessageType;
  rebates: EnergyCalculatorRebate[];
};

export const renderCategoryDescription = (rebateType: EnergyCalculatorRebateCategoryType) => {
  const categoryDescriptionMap = {
    hvac: {
      formattedMessage: (
        <FormattedMessage
          id="hvac.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of a heat pump to make your home heating, ventilation, and/or cooling system more efficient. Heat pumps use less energy than other systems like gas furnaces and central air. You can type the estimated cost of a heat pump into one or more of the white boxes below to estimate your savings. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/heating-and-cooling-homeowner',
    },
    waterHeater: {
      formattedMessage: (
        <FormattedMessage
          id="waterHeater.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of a heat pump water heater (HPWH). HPWHs are energy-efficient water heaters. They can help the average homeowner save hundreds of dollars in energy costs each year. You can type the estimated cost of a HPWH into one or more of the white boxes below to estimate your savings. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/heating-and-cooling-homeowner',
    },
    stove: {
      formattedMessage: (
        <FormattedMessage
          id="stove.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of an electric / induction stove. These stoves are more energy-efficient than gas or traditional electric stoves. You can type the estimated cost of an electric / induction stove into the white box below to estimate your savings. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/cooking-homeowner',
    },
  };
  const categoryDescription = categoryDescriptionMap[rebateType].formattedMessage;
  const href = categoryDescriptionMap[rebateType].href;

  return (
    <article className="category-description-article">
      {categoryDescription}
      <TrackedOutboundLink
        href={href}
        className="link-color"
        action="rewiring_america_link_click"
        label="Rewiring America"
        category="energy_rebate"
        additionalData={{
          rebate_category: rebateType,
        }}
      >
        Rewiring America.
      </TrackedOutboundLink>
    </article>
  );
};
