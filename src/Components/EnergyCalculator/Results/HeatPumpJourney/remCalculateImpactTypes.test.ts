import {
  buildCalculateImpactPayload,
  isValidRemImpactApiResponse,
  CALCULATE_IMPACT_UPGRADE_MAP,
  type CalculateImpactUpgradeChoice,
  type RemFuelType,
  type CalculateImpactHouseholdType,
} from './remCalculateImpactTypes';

// ─── Shared fixture ────────────────────────────────────────────────────────────

const VALID_STAT = { value: -21.9, unit: '$' };
const VALID_RANGE = {
  mean: VALID_STAT,
  median: VALID_STAT,
  percentile_20: VALID_STAT,
  percentile_80: VALID_STAT,
};
const VALID_RESPONSE = { bill_delta: VALID_RANGE, emissions_delta: VALID_RANGE };

describe('isValidRemImpactApiResponse', () => {
  it('returns true for a well-formed response', () => {
    expect(isValidRemImpactApiResponse(VALID_RESPONSE)).toBe(true);
  });

  it('returns false for null / undefined', () => {
    expect(isValidRemImpactApiResponse(null)).toBe(false);
    expect(isValidRemImpactApiResponse(undefined)).toBe(false);
  });

  it('returns false when bill_delta is missing entirely', () => {
    expect(isValidRemImpactApiResponse({ emissions_delta: VALID_RANGE })).toBe(false);
  });

  it('returns false when a percentile key is absent from bill_delta', () => {
    const missingPercentile = {
      ...VALID_RESPONSE,
      bill_delta: { mean: VALID_STAT, median: VALID_STAT, percentile_20: VALID_STAT },
    };
    expect(isValidRemImpactApiResponse(missingPercentile)).toBe(false);
  });

  it('returns false when a stat value is null (backend defensive default becomes 0, but upstream could send null)', () => {
    const nullValue = {
      ...VALID_RESPONSE,
      bill_delta: { ...VALID_RANGE, median: { value: null, unit: '$' } },
    };
    expect(isValidRemImpactApiResponse(nullValue)).toBe(false);
  });

  it('returns false when a stat value is a string instead of a number', () => {
    const stringValue = {
      ...VALID_RESPONSE,
      emissions_delta: { ...VALID_RANGE, percentile_80: { value: '-430', unit: 'lbCO2e' } },
    };
    expect(isValidRemImpactApiResponse(stringValue)).toBe(false);
  });
});

describe('CALCULATE_IMPACT_UPGRADE_MAP', () => {
  it('maps heat_pump to the correct REM upgrade', () => {
    expect(CALCULATE_IMPACT_UPGRADE_MAP.heat_pump).toBe('hvac__heat_pump_seer24_hspf13');
  });

  it('maps heat_pump_water_heater to the correct REM upgrade', () => {
    expect(CALCULATE_IMPACT_UPGRADE_MAP.heat_pump_water_heater).toBe('water_heater__heat_pump_uef3.35');
  });

  it('contains exactly the two non-weatherization upgrade choices', () => {
    // Weatherization-based choices are intentionally excluded per CESN SME guidance.
    expect(Object.keys(CALCULATE_IMPACT_UPGRADE_MAP)).toEqual(['heat_pump', 'heat_pump_water_heater']);
  });
});

describe('buildCalculateImpactPayload', () => {
  const baseInput = {
    upgradeChoice: 'heat_pump' as CalculateImpactUpgradeChoice,
    address: '1234 Main St, Denver, CO 80014',
    heatingFuel: 'natural_gas' as RemFuelType,
    waterHeatingFuel: '' as RemFuelType | '',
    householdType: 'single_family_detached' as CalculateImpactHouseholdType,
  };

  it('builds the correct payload structure', () => {
    const payload = buildCalculateImpactPayload(baseInput);

    expect(payload).toEqual({
      remAddressQuery: {
        upgrade: 'hvac__heat_pump_seer24_hspf13',
        address: '1234 Main St, Denver, CO 80014',
        heating_fuel: 'natural_gas',
        water_heater_fuel: null,
      },
      household_type: 'single_family_detached',
    });
  });

  it('trims whitespace from the address', () => {
    const payload = buildCalculateImpactPayload({
      ...baseInput,
      address: '  123 Elm St, Boulder, CO 80301  ',
    });

    expect(payload.remAddressQuery.address).toBe('123 Elm St, Boulder, CO 80301');
  });

  it('sets water_heater_fuel to null when waterHeatingFuel is empty string', () => {
    const payload = buildCalculateImpactPayload({
      ...baseInput,
      waterHeatingFuel: '',
    });

    expect(payload.remAddressQuery.water_heater_fuel).toBeNull();
  });

  it('passes through a specified water heating fuel value', () => {
    const payload = buildCalculateImpactPayload({
      ...baseInput,
      waterHeatingFuel: 'propane',
    });

    expect(payload.remAddressQuery.water_heater_fuel).toBe('propane');
  });

  it('maps each upgrade choice correctly', () => {
    const choices: CalculateImpactUpgradeChoice[] = ['heat_pump', 'heat_pump_water_heater'];

    choices.forEach((choice) => {
      const payload = buildCalculateImpactPayload({ ...baseInput, upgradeChoice: choice });
      expect(payload.remAddressQuery.upgrade).toBe(CALCULATE_IMPACT_UPGRADE_MAP[choice]);
    });
  });

  it('maps each fuel type correctly for heating_fuel', () => {
    const fuels: RemFuelType[] = ['natural_gas', 'propane', 'electricity', 'fuel_oil'];

    fuels.forEach((fuel) => {
      const payload = buildCalculateImpactPayload({ ...baseInput, heatingFuel: fuel });
      expect(payload.remAddressQuery.heating_fuel).toBe(fuel);
    });
  });

  it('maps each household type correctly', () => {
    const types: CalculateImpactHouseholdType[] = [
      'single_family_detached',
      'single_family_attached',
      'apartment_condo',
      'mobile_home',
    ];

    types.forEach((type) => {
      const payload = buildCalculateImpactPayload({ ...baseInput, householdType: type });
      expect(payload.household_type).toBe(type);
    });
  });
});
