// EPA Greenhouse Gas Equivalencies Calculator
// https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
// Page last updated: 2026-03-30. Retrieved: 2026-06-03.
//
// 1 acre of average U.S. forest sequesters 1.00 metric ton CO₂/yr
// Derivation: -0.27 metric ton C/acre/yr × (44 CO₂ / 12 C) = -1.00 metric ton CO₂/acre/yr

const LBS_PER_METRIC_TON = 2204.62;
const LBS_CO2E_PER_FOREST_ACRE_PER_YEAR = 1.0 * LBS_PER_METRIC_TON; // 2204.62 lb CO₂e

export interface EpaEquivalencyResult {
  id: string;
  value: number;
  labelMessageId: string;
  labelDefaultMessage: string;
}

// Each entry defines one EPA equivalency. Add new entries here to enable them in the UI.
// Only forest_acres is shown per the Step 3 design (MFB-981). Future entries are stubbed below.
const EPA_EQUIVALENCIES = [
  {
    id: 'forest_acres',
    convert: (lbsCO2e: number): number => Math.abs(lbsCO2e) / LBS_CO2E_PER_FOREST_ACRE_PER_YEAR,
    labelMessageId: 'energyCalculator.calculateImpact.epa.forestAcres',
    labelDefaultMessage: '{value} acres of U.S. forests in one year',
  },
  // To add more equivalencies, append entries here, e.g.:
  // {
  //   id: 'miles_driven',
  //   // EPA: 8,887 g CO₂/gallon × 1 gallon/22.3 miles ≈ 0.000404 metric tons CO₂/mile
  //   convert: (lbs) => Math.abs(lbs) / (0.000404 * LBS_PER_METRIC_TON),
  //   labelMessageId: 'energyCalculator.calculateImpact.epa.milesDriven',
  //   labelDefaultMessage: '{value} miles driven by an average passenger car',
  // },
  // {
  //   id: 'gallons_gasoline',
  //   // EPA: 8,887 g CO₂/gallon of gasoline
  //   convert: (lbs) => Math.abs(lbs) / (8.887 / 1000 * LBS_PER_METRIC_TON / 1000),
  //   labelMessageId: 'energyCalculator.calculateImpact.epa.gallonsGasoline',
  //   labelDefaultMessage: '{value} gallons of gasoline burned',
  // },
];

export const EPA_DATA_SOURCE_MESSAGE_ID = 'energyCalculator.calculateImpact.epa.dataSource';
export const EPA_DATA_SOURCE_DEFAULT_MESSAGE = "EPA's Greenhouse Gas Equivalencies Calculator";

export function getEpaEquivalencies(emissionsLbsCO2e: number): EpaEquivalencyResult[] {
  return EPA_EQUIVALENCIES.map((eq) => ({
    id: eq.id,
    value: eq.convert(emissionsLbsCO2e),
    labelMessageId: eq.labelMessageId,
    labelDefaultMessage: eq.labelDefaultMessage,
  }));
}
