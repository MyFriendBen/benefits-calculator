// NOTE: source: https://github.com/rewiringamerica/embed.rewiringamerica.org/blob/main/src/api/calculator-types-v1.ts
import { FormattedMessage } from 'react-intl';
import { FormData } from '../../../Types/FormData';
import { FormattedMessageType } from '../../../Types/Questions';
import TrackedOutboundLink from '../../Common/TrackedOutboundLink/TrackedOutboundLink';
import { EFFICIENCY_WORKS_PROVIDERS, XCEL_PROVIDER } from '../providers';

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
  'duct_sealing',
  'electric_thermal_storage_and_slab',
  'evaporative_cooler',
  'geothermal_heating_installation',
  'other_heat_pump',
  // water heater
  'heat_pump_water_heater',
  'non_heat_pump_water_heater',
  // stove
  'electric_stove',
  // efficiency & weatherization
  'air_sealing',
  'attic_or_roof_insulation',
  'basement_insulation',
  'battery_storage_installation',
  'crawlspace_insulation',
  'electric_outdoor_equipment',
  'electric_panel',
  'electric_wiring',
  'energy_audit',
  'floor_insulation',
  'heat_pump_clothes_dryer',
  'non_heat_pump_clothes_dryer',
  'other_insulation',
  'other_weatherization',
  'rooftop_solar_installation',
  'smart_thermostat',
  'wall_insulation',
  // electric vehicles
  'new_electric_vehicle',
  'used_electric_vehicle',
  'new_plugin_hybrid_vehicle',
  'used_plugin_hybrid_vehicle',
  'electric_vehicle_charger',
  'ebike',
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
  ira_status?: 'active' | 'paused' | 'inactive';
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

export type EnergyCalculatorRebateCategoryType = 'hvac' | 'waterHeater' | 'stove' | 'efficiencyWeatherization' | 'electricVehicles';

export const ENERGY_CALCULATOR_CATEGORY_MAP: Record<EnergyCalculatorItemType, EnergyCalculatorRebateCategoryType> = {
  air_to_water_heat_pump: 'hvac',
  central_air_conditioner: 'hvac',
  ducted_heat_pump: 'hvac',
  ductless_heat_pump: 'hvac',
  duct_sealing: 'hvac',
  electric_thermal_storage_and_slab: 'hvac',
  evaporative_cooler: 'hvac',
  geothermal_heating_installation: 'hvac',
  other_heat_pump: 'hvac',
  heat_pump_water_heater: 'waterHeater',
  non_heat_pump_water_heater: 'waterHeater',
  electric_stove: 'stove',
  air_sealing: 'efficiencyWeatherization',
  attic_or_roof_insulation: 'efficiencyWeatherization',
  basement_insulation: 'efficiencyWeatherization',
  battery_storage_installation: 'efficiencyWeatherization',
  crawlspace_insulation: 'efficiencyWeatherization',
  electric_outdoor_equipment: 'efficiencyWeatherization',
  electric_panel: 'efficiencyWeatherization',
  electric_wiring: 'efficiencyWeatherization',
  energy_audit: 'efficiencyWeatherization',
  floor_insulation: 'efficiencyWeatherization',
  heat_pump_clothes_dryer: 'efficiencyWeatherization',
  non_heat_pump_clothes_dryer: 'efficiencyWeatherization',
  other_insulation: 'efficiencyWeatherization',
  other_weatherization: 'efficiencyWeatherization',
  rooftop_solar_installation: 'efficiencyWeatherization',
  smart_thermostat: 'efficiencyWeatherization',
  wall_insulation: 'efficiencyWeatherization',
  new_electric_vehicle: 'electricVehicles',
  used_electric_vehicle: 'electricVehicles',
  new_plugin_hybrid_vehicle: 'electricVehicles',
  used_plugin_hybrid_vehicle: 'electricVehicles',
  electric_vehicle_charger: 'electricVehicles',
  ebike: 'electricVehicles',
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
  efficiencyWeatherization: (
    <FormattedMessage
      id="energyCalculator.results.category.efficiencyWeatherization.title"
      defaultMessage="Efficiency & Weatherization"
    />
  ),
  electricVehicles: (
    <FormattedMessage
      id="energyCalculator.results.category.electricVehicles.title"
      defaultMessage="Electric Vehicles"
    />
  ),
};

export type EnergyCalculatorRebateCategory = {
  type: EnergyCalculatorRebateCategoryType;
  name: FormattedMessageType;
  rebates: EnergyCalculatorRebate[];
};

// Helper function to determine provider type for heat pump content
const getHeatPumpProviderType = (formData: FormData | undefined): 'xcel' | 'efficiency_works' | 'other' => {
  const electricProvider = formData?.energyCalculator?.electricProvider;

  if (!electricProvider) {
    return 'other';
  }

  if (electricProvider === XCEL_PROVIDER) {
    return 'xcel';
  }

  if (EFFICIENCY_WORKS_PROVIDERS.includes(electricProvider)) {
    return 'efficiency_works';
  }

  return 'other';
};

// Common heat pump content shared across all providers
const renderSharedHeatPumpContent = () => {
  return (
    <>
      <p className="energy-calculator-p-spacing">
        <FormattedMessage
          id="co.energy.heat_pump_other_p1"
          defaultMessage="You may qualify for savings on the cost of a heat pump for your home heating, ventilation, and/or cooling system. Heat pumps reduce your carbon footprint, allow you to remove a furnace that burns gas inside your home, and increase comfort, among other benefits. There are numerous combinations or 'stacking' possibilities for heat pump rebates. A trusted contractor can help you maximize your rebate possibilities."
        />
      </p>
      <p className="energy-calculator-p-spacing">
        <FormattedMessage
          id="co.energy.heat_pump_other_p2"
          defaultMessage="Learn more about heat pumps, including upfront costs, ongoing costs, average life span, and how to initiate a project in this {heatPumpGuide}, from our partners at {rewiringAmerica}."
          values={{
            heatPumpGuide: (
              <TrackedOutboundLink
                href="https://homes.rewiringamerica.org/projects/heating-and-cooling-homeowner"
                className="link-color"
                action="heat_pump_guide_click"
                label="Heat Pump Guide"
                category="energy_rebate"
              >
                <FormattedMessage id="co.energy.heat_pump_guide_link" defaultMessage="Heat Pump Guide" />
              </TrackedOutboundLink>
            ),
            rewiringAmerica: (
              <TrackedOutboundLink
                href="https://www.rewiringamerica.org"
                className="link-color"
                action="rewiring_america_click"
                label="Rewiring America"
                category="energy_rebate"
              >
                <FormattedMessage id="co.energy.rewiring_america_link" defaultMessage="Rewiring America" />
              </TrackedOutboundLink>
            ),
          }}
        />
      </p>
    </>
  );
};

export const renderCategoryDescription = (rebateType: EnergyCalculatorRebateCategoryType, formData?: FormData) => {
  // Special handling for HVAC category with provider-specific content
  if (rebateType === 'hvac' && formData) {
    const providerType = getHeatPumpProviderType(formData);

    // Provider-specific content for heat pumps
    if (providerType === 'xcel') {
      return (
        <article className="category-description-article">
          {renderSharedHeatPumpContent()}
          <p className="energy-calculator-p-spacing">
            <FormattedMessage
              id="co.energy.heat_pump_xcel_p3"
              defaultMessage="Consult with an {contractorLink} to determine your heat pump unit size and potential rebate."
              values={{
                contractorLink: (
                  <TrackedOutboundLink
                    href="https://hvacree.net/xcel-co/public_search.cfm"
                    className="link-color"
                    action="xcel_contractor_click"
                    label="Xcel Energy Registered Contractor"
                    category="energy_rebate"
                  >
                    <FormattedMessage
                      id="co.energy.heat_pump_contractor_link_xcel"
                      defaultMessage="Xcel Energy Registered Contractor"
                    />
                  </TrackedOutboundLink>
                ),
              }}
            />
          </p>
        </article>
      );
    }

    if (providerType === 'efficiency_works') {
      return (
        <article className="category-description-article">
          {renderSharedHeatPumpContent()}
          <p className="energy-calculator-p-spacing">
            <FormattedMessage
              id="co.energy.heat_pump_efficiency_works_p3"
              defaultMessage="Consult with an {contractorLink} to determine your heat pump unit size and potential rebate."
              values={{
                contractorLink: (
                  <TrackedOutboundLink
                    href="https://efficiencyworks.my.site.com/tradeally/s/findtradeally"
                    className="link-color"
                    action="efficiency_works_contractor_click"
                    label="Efficiency Works service provider"
                    category="energy_rebate"
                  >
                    <FormattedMessage
                      id="co.energy.heat_pump_contractor_link_efficiency_works"
                      defaultMessage="Efficiency Works service provider"
                    />
                  </TrackedOutboundLink>
                ),
              }}
            />
          </p>
        </article>
      );
    }

    // Default/Other providers
    return (
      <article className="category-description-article">
        {renderSharedHeatPumpContent()}
        <p className="energy-calculator-p-spacing">
          <FormattedMessage
            id="co.energy.heat_pump_other_p3"
            defaultMessage="Check if your electric utility has a preferred HVAC contractor list or begin your {contractorLink}."
            values={{
              contractorLink: (
                <TrackedOutboundLink
                  href="https://homes.rewiringamerica.org/contractor-networks"
                  className="link-color"
                  action="generic_contractor_click"
                  label="contractor search here"
                  category="energy_rebate"
                >
                  <FormattedMessage
                    id="co.energy.heat_pump_contractor_link_other"
                    defaultMessage="contractor search here"
                  />
                </TrackedOutboundLink>
              ),
            }}
          />
        </p>
      </article>
    );
  }

  // Default content for other categories
  const categoryDescriptionMap = {
    hvac: {
      formattedMessage: (
        <FormattedMessage
          id="hvac.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of a heat pump to make your home heating, ventilation, and/or cooling system more efficient. Heat pumps use less energy than other systems like gas furnaces and central air. You can type the estimated cost of a heat pump into one or more of the white boxes below to estimate your savings. Inspections or work done on a rented home may require a landlord's consent. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/heating-and-cooling-homeowner',
    },
    waterHeater: {
      formattedMessage: (
        <FormattedMessage
          id="waterHeater.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of a heat pump water heater (HPWH). HPWHs are energy-efficient water heaters. They can help the average homeowner save hundreds of dollars in energy costs each year. You can type the estimated cost of a HPWH into one or more of the white boxes below to estimate your savings. Inspections or work done on a rented home may require a landlord's consent. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/heating-and-cooling-homeowner',
    },
    stove: {
      formattedMessage: (
        <FormattedMessage
          id="stove.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of an electric / induction stove. These stoves are more energy-efficient than gas or traditional electric stoves. You can type the estimated cost of an electric / induction stove into the white box below to estimate your savings. Inspections or work done on a rented home may require a landlord's consent. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/cooking-homeowner',
    },
    efficiencyWeatherization: {
      formattedMessage: (
        <FormattedMessage
          id="efficiencyWeatherization.categoryDescription"
          defaultMessage="You may qualify for rebates that reduce the cost of electrifying your home or making it more energy efficient. Inspections or work done on a rented home may require a landlord's consent. For more information, visit our partners at "
        />
      ),
      href: 'https://homes.rewiringamerica.org/projects/landlord/talk-to-your-landlord-about-electrification-renter',
    },
    electricVehicles: {
      formattedMessage: (
        <FormattedMessage
          id="electricVehicles.categoryDescription"
          defaultMessage="You may qualify for savings on the cost of a new or used electric vehicle (EV) or new electric bike (eBike). EVs cost less to maintain than gas-powered cars, in addition to being quieter, and having longer-lasting brakes and lower emissions. E-bikes are a safe, reliable, and quick method of transportation that can reduce many short vehicle trips. For more information on the benefits and considerations of transitioning to an EV, visit "
        />
      ),
      href: 'https://energyoffice.colorado.gov/transportation/electric-vehicles',
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
