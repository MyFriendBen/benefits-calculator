/**
 * Types and helpers aligned with Rewiring America Residential Electrification Model (REM)
 * GET /api/v1/rem/address — see https://docs.rewiringamerica.org/api/residential-electrification-model
 */

// ─── Backend response types ───────────────────────────────────────────────────

export interface RemImpactStat {
  value: number;
  unit: string; // '$' for bill_delta; 'lbCO2e' for emissions_delta (converted by backend)
}

export interface RemImpactRange {
  mean: RemImpactStat;
  median: RemImpactStat;
  percentile_20: RemImpactStat;
  percentile_80: RemImpactStat;
}

/** Response shape from GET /api/screener-options/<white_label>/rem-impact/ */
export interface RemImpactApiResponse {
  bill_delta: RemImpactRange;       // annual cost delta in $; negative = savings
  emissions_delta: RemImpactRange;  // annual CO₂e delta in lbCO2e; negative = reduction
}

const RANGE_KEYS: ReadonlyArray<keyof RemImpactRange> = ['mean', 'median', 'percentile_20', 'percentile_80'];

/**
 * Guards against a partial RA response (e.g. a missing percentile key) that
 * would otherwise cause a TypeError in CalculateImpactResults at render time —
 * after the promise has already resolved and past the .catch() that shows the
 * error Alert. Call this before setSubmitState({ status: 'success' }).
 */
export function isValidRemImpactApiResponse(data: unknown): data is RemImpactApiResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  for (const delta of ['bill_delta', 'emissions_delta'] as const) {
    const range = d[delta];
    if (!range || typeof range !== 'object') return false;
    const r = range as Record<string, unknown>;
    for (const key of RANGE_KEYS) {
      const stat = r[key];
      if (!stat || typeof stat !== 'object') return false;
      if (typeof (stat as Record<string, unknown>)['value'] !== 'number') return false;
    }
  }
  return true;
}

// ─── Form values (shared between form and results summary) ───────────────────

export interface CalculateImpactFormValues {
  householdType: CalculateImpactHouseholdType;
  address: string;
  heatingFuel: RemFuelType;
  waterHeatingFuel?: RemFuelType;
  upgradeChoice: CalculateImpactUpgradeChoice;
}

// ─── Display label lookup maps (used by CalculateImpactResults summary card) ─

export const HOUSEHOLD_TYPE_LABEL_MAP: Record<CalculateImpactHouseholdType, { messageId: string; defaultMessage: string }> = {
  single_family_detached: { messageId: 'energyCalculator.calculateImpact.householdType.singleFamilyDetached', defaultMessage: 'House' },
  apartment_condo: { messageId: 'energyCalculator.calculateImpact.householdType.apartmentCondo', defaultMessage: 'Apartment' },
  mobile_home: { messageId: 'energyCalculator.calculateImpact.householdType.mobileHome', defaultMessage: 'Mobile home' },
  single_family_attached: { messageId: 'energyCalculator.calculateImpact.householdType.singleFamilyAttached', defaultMessage: 'Townhome' },
};

export const FUEL_TYPE_LABEL_MAP: Record<RemFuelType, { messageId: string; defaultMessage: string }> = {
  electricity: { messageId: 'energyCalculator.calculateImpact.fuel.electricity', defaultMessage: 'Electricity' },
  natural_gas: { messageId: 'energyCalculator.calculateImpact.fuel.naturalGas', defaultMessage: 'Natural gas' },
  fuel_oil: { messageId: 'energyCalculator.calculateImpact.fuel.fuelOil', defaultMessage: 'Fuel oil' },
  propane: { messageId: 'energyCalculator.calculateImpact.fuel.propane', defaultMessage: 'Propane' },
};

export const UPGRADE_LABEL_MAP: Record<CalculateImpactUpgradeChoice, { messageId: string; defaultMessage: string }> = {
  heat_pump: { messageId: 'energyCalculator.calculateImpact.upgrade.heatPump', defaultMessage: 'Heat pump' },
  heat_pump_water_heater: { messageId: 'energyCalculator.calculateImpact.upgrade.heatPumpWaterHeater', defaultMessage: 'Heat pump water heater' },
};

/**
 * `upgrade` query param on /api/v1/rem/address.
 * The weatherization values remain valid REM API inputs even though no app-level
 * upgrade choice currently maps to them — keep them so the REM contract stays complete.
 */
export type RemUpgrade =
  | 'hvac__heat_pump_seer24_hspf13'
  | 'weatherization__insulation_air_duct_sealing'
  | 'combination__hvac_seer18_hspf10__weatherization'
  | 'water_heater__heat_pump_uef3.35';

/** `heating_fuel` / `water_heater_fuel` query params */
export type RemFuelType = 'electricity' | 'fuel_oil' | 'natural_gas' | 'propane';

/**
 * User-facing "select upgrade" options → REM `upgrade` enum.
 * Weatherization-based choices are intentionally excluded: per CESN SME guidance,
 * their bill impact can't be modeled reliably without the home's current condition,
 * so they're surfaced as a results note instead of an upgrade option.
 */
export type CalculateImpactUpgradeChoice = 'heat_pump' | 'heat_pump_water_heater';

export const CALCULATE_IMPACT_UPGRADE_MAP: Record<CalculateImpactUpgradeChoice, RemUpgrade> = {
  heat_pump: 'hvac__heat_pump_seer24_hspf13',
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
