/**
 * Types and helpers aligned with Rewiring America Residential Electrification Model (REM)
 * GET /api/v1/rem/address — see https://docs.rewiringamerica.org/api/residential-electrification-model
 */

/** `upgrade` query param on /api/v1/rem/address */
export type RemUpgrade =
  | 'hvac__heat_pump_seer24_hspf13'
  | 'weatherization__insulation_air_duct_sealing'
  | 'combination__hvac_seer18_hspf10__weatherization'
  | 'water_heater__heat_pump_uef3.35';

/** `heating_fuel` / `water_heater_fuel` query params */
export type RemFuelType = 'electricity' | 'fuel_oil' | 'natural_gas' | 'propane';

/** User-facing "select upgrade" options → REM `upgrade` enum */
export type CalculateImpactUpgradeChoice =
  | 'heat_pump'
  | 'weatherization'
  | 'heat_pump_weatherization'
  | 'heat_pump_water_heater';

export const CALCULATE_IMPACT_UPGRADE_MAP: Record<CalculateImpactUpgradeChoice, RemUpgrade> = {
  heat_pump: 'hvac__heat_pump_seer24_hspf13',
  weatherization: 'weatherization__insulation_air_duct_sealing',
  heat_pump_weatherization: 'combination__hvac_seer18_hspf10__weatherization',
  heat_pump_water_heater: 'water_heater__heat_pump_uef3.35',
};

/** Building / household type for the form (not yet a REM /address param; included for Step 3+) */
export type CalculateImpactHouseholdType =
  | 'single_family_detached'
  | 'single_family_attached'
  | 'apartment_condo'
  | 'mobile_home';

export type CalculateImpactRemAddressQuery = {
  upgrade: RemUpgrade;
  address: string;
  heating_fuel: RemFuelType;
  water_heater_fuel: RemFuelType | null;
};

/** Payload logged on submit until Step 3 wires the API */
export type CalculateImpactSubmitPayload = {
  remAddressQuery: CalculateImpactRemAddressQuery;
  household_type: CalculateImpactHouseholdType;
};

export function buildCalculateImpactPayload(input: {
  upgradeChoice: CalculateImpactUpgradeChoice;
  address: string;
  heatingFuel: RemFuelType;
  waterHeatingFuel: RemFuelType | '';
  householdType: CalculateImpactHouseholdType;
}): CalculateImpactSubmitPayload {
  return {
    remAddressQuery: {
      upgrade: CALCULATE_IMPACT_UPGRADE_MAP[input.upgradeChoice],
      address: input.address.trim(),
      heating_fuel: input.heatingFuel,
      water_heater_fuel: input.waterHeatingFuel === '' ? null : input.waterHeatingFuel,
    },
    household_type: input.householdType,
  };
}
