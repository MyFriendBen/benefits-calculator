import { InputAdornment, TextField } from '@mui/material';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { FormattedMessageType } from '../../../Types/Questions';
import { handleNumbersOnly, NUM_PAD_PROPS } from '../../../Assets/numInputHelpers';
import { formatToUSD } from '../../Results/FormattedValue';
import {
  EnergyCalculatorAmountUnit,
  EnergyCalculatorIncentive,
  EnergyCalculatorItemType,
  EnergyCalculatorRebate,
  EnergyCalculatorRebateCategoryType,
  ENERGY_CALCULATOR_CATEGORY_MAP,
} from './rebateTypes';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';

// ============================================================================
// CONFIGURATION OBJECTS
// ============================================================================

type MessageConfig = {
  id: string;
  defaultMessage: string;
};

type ItemGroup = 'air_source_heat_pump' | 'clothes_dryer' | 'generic_heat_pump' | 'insulation' | 'water_heater';

/**
 * Item name mappings for single-item rebates
 */
const ITEM_NAME_MAP: Record<EnergyCalculatorItemType, MessageConfig> = {
  air_to_water_heat_pump: {
    id: 'energyCalculator.rebatePage.title.itemName.airToWaterHeatPump',
    defaultMessage: 'an air-to-water heat pump',
  },
  central_air_conditioner: {
    id: 'energyCalculator.rebatePage.title.itemName.centralAirConditioner',
    defaultMessage: 'a central air conditioner',
  },
  ducted_heat_pump: {
    id: 'energyCalculator.rebatePage.title.itemName.ductedHeatPump',
    defaultMessage: 'a ducted heat pump',
  },
  ductless_heat_pump: {
    id: 'energyCalculator.rebatePage.title.itemName.ductlessHeatPump',
    defaultMessage: 'a ductless heat pump',
  },
  duct_sealing: {
    id: 'energyCalculator.rebatePage.title.itemName.ductSealing',
    defaultMessage: 'duct sealing',
  },
  electric_stove: {
    id: 'energyCalculator.rebatePage.title.itemName.electricStove',
    defaultMessage: 'an electric/induction stove',
  },
  electric_thermal_storage_and_slab: {
    id: 'energyCalculator.rebatePage.title.itemName.electricThermalStorageAndSlab',
    defaultMessage: 'electric thermal storage and slab',
  },
  evaporative_cooler: {
    id: 'energyCalculator.rebatePage.title.itemName.evaporativeCooler',
    defaultMessage: 'an evaporative cooler',
  },
  geothermal_heating_installation: {
    id: 'energyCalculator.rebatePage.title.itemName.geothermalHeatingInstallation',
    defaultMessage: 'geothermal heating installation',
  },
  heat_pump_clothes_dryer: {
    id: 'energyCalculator.rebatePage.title.itemName.heatPumpClothesDryer',
    defaultMessage: 'a heat pump clothes dryer',
  },
  heat_pump_water_heater: {
    id: 'energyCalculator.rebatePage.title.itemName.heatPumpWaterHeater',
    defaultMessage: 'a heat pump water heater',
  },
  non_heat_pump_clothes_dryer: {
    id: 'energyCalculator.rebatePage.title.itemName.nonHeatPumpClothesDryer',
    defaultMessage: 'an electric clothes dryer',
  },
  non_heat_pump_water_heater: {
    id: 'energyCalculator.rebatePage.title.itemName.nonHeatPumpWaterHeater',
    defaultMessage: 'an electric water heater',
  },
  other_heat_pump: {
    id: 'energyCalculator.rebatePage.title.itemName.otherHeatPump',
    defaultMessage: 'a heat pump',
  },
  rooftop_solar_installation: {
    id: 'energyCalculator.rebatePage.title.itemName.rooftopSolarInstallation',
    defaultMessage: 'rooftop solar installation',
  },
  battery_storage_installation: {
    id: 'energyCalculator.rebatePage.title.itemName.batteryStorageInstallation',
    defaultMessage: 'battery storage installation',
  },
  electric_wiring: {
    id: 'energyCalculator.rebatePage.title.itemName.electricWiring',
    defaultMessage: 'electric wiring',
  },
  electric_panel: {
    id: 'energyCalculator.rebatePage.title.itemName.electricPanel',
    defaultMessage: 'electric panel upgrade',
  },
  smart_thermostat: {
    id: 'energyCalculator.rebatePage.title.itemName.smartThermostat',
    defaultMessage: 'a smart thermostat',
  },
  electric_outdoor_equipment: {
    id: 'energyCalculator.rebatePage.title.itemName.electricOutdoorEquipment',
    defaultMessage: 'electric outdoor equipment',
  },
  energy_audit: {
    id: 'energyCalculator.rebatePage.title.itemName.energyAudit',
    defaultMessage: 'an energy audit',
  },
  air_sealing: {
    id: 'energyCalculator.rebatePage.title.itemName.airSealing',
    defaultMessage: 'air sealing',
  },
  attic_or_roof_insulation: {
    id: 'energyCalculator.rebatePage.title.itemName.atticOrRoofInsulation',
    defaultMessage: 'attic or roof insulation',
  },
  basement_insulation: {
    id: 'energyCalculator.rebatePage.title.itemName.basementInsulation',
    defaultMessage: 'basement insulation',
  },
  crawlspace_insulation: {
    id: 'energyCalculator.rebatePage.title.itemName.crawlspaceInsulation',
    defaultMessage: 'crawlspace insulation',
  },
  floor_insulation: {
    id: 'energyCalculator.rebatePage.title.itemName.floorInsulation',
    defaultMessage: 'floor insulation',
  },
  other_insulation: {
    id: 'energyCalculator.rebatePage.title.itemName.otherInsulation',
    defaultMessage: 'other insulation',
  },
  other_weatherization: {
    id: 'energyCalculator.rebatePage.title.itemName.otherWeatherization',
    defaultMessage: 'other weatherization',
  },
  wall_insulation: {
    id: 'energyCalculator.rebatePage.title.itemName.wallInsulation',
    defaultMessage: 'wall insulation',
  },
};

/**
 * Item groups for multi-item rebates
 * Note: Groups are checked in order, so if one group is a subset of another,
 * the smaller group should be listed first (e.g. air source heat pumps before generic heat pumps)
 */
const ITEM_GROUPS: Array<{
  group: ItemGroup;
  members: Set<EnergyCalculatorItemType>;
  message: MessageConfig;
}> = [
  {
    group: 'air_source_heat_pump',
    members: new Set(['ducted_heat_pump', 'ductless_heat_pump', 'air_to_water_heat_pump']),
    message: {
      id: 'energyCalculator.rebatePage.title.itemName.airSourceHeatPump',
      defaultMessage: 'an air source heat pump',
    },
  },
  {
    group: 'clothes_dryer',
    members: new Set(['heat_pump_clothes_dryer', 'non_heat_pump_clothes_dryer']),
    message: {
      id: 'energyCalculator.rebatePage.title.itemName.clothesDryer',
      defaultMessage: 'a clothes dryer',
    },
  },
  {
    group: 'generic_heat_pump',
    members: new Set([
      'air_to_water_heat_pump',
      'ducted_heat_pump',
      'ductless_heat_pump',
      'geothermal_heating_installation',
      'other_heat_pump',
    ]),
    message: {
      id: 'energyCalculator.rebatePage.title.itemName.genericHeatPump',
      defaultMessage: 'a heat pump',
    },
  },
  {
    group: 'insulation',
    members: new Set([
      'attic_or_roof_insulation',
      'basement_insulation',
      'crawlspace_insulation',
      'floor_insulation',
      'other_insulation',
      'wall_insulation',
    ]),
    message: {
      id: 'energyCalculator.rebatePage.title.itemName.insulation',
      defaultMessage: 'insulation',
    },
  },
  {
    group: 'water_heater',
    members: new Set(['heat_pump_water_heater', 'non_heat_pump_water_heater']),
    message: {
      id: 'energyCalculator.rebatePage.title.itemName.waterHeater',
      defaultMessage: 'a water heater',
    },
  },
];

/**
 * Page-based titles for multi-item rebates spanning multiple categories
 */
const PAGE_TITLE_MAP: Record<EnergyCalculatorRebateCategoryType, MessageConfig> = {
  efficiencyWeatherization: {
    id: 'energyCalculator.rebatePage.title.itemName.pageEfficiencyWeatherization',
    defaultMessage: 'efficiency & weatherization',
  },
  waterHeater: {
    id: 'energyCalculator.rebatePage.title.itemName.pageWaterHeater',
    defaultMessage: 'water heater',
  },
  hvac: {
    id: 'energyCalculator.rebatePage.title.itemName.pageHVAC',
    defaultMessage: 'heating, ventilation & cooling',
  },
  stove: {
    id: 'energyCalculator.rebatePage.title.itemName.pageStove',
    defaultMessage: 'upgrades',
  },
};

/**
 * Unit type mappings
 */
const UNIT_MAP: Record<EnergyCalculatorAmountUnit, MessageConfig> = {
  btuh10k: {
    id: 'energyCalculator.rebatePage.title.amountUnit.btuh10k',
    defaultMessage: '10,000 Btuh',
  },
  kilowatt: {
    id: 'energyCalculator.rebatePage.title.amountUnit.kilowatt',
    defaultMessage: 'kilowatt',
  },
  kilowatt_hour: {
    id: 'energyCalculator.rebatePage.title.amountUnit.kilowattHour',
    defaultMessage: 'kilowatt-hour',
  },
  square_foot: {
    id: 'energyCalculator.rebatePage.title.amountUnit.squareFoot',
    defaultMessage: 'square foot',
  },
  ton: {
    id: 'energyCalculator.rebatePage.title.amountUnit.ton',
    defaultMessage: 'ton',
  },
  watt: {
    id: 'energyCalculator.rebatePage.title.amountUnit.watt',
    defaultMessage: 'watt',
  },
};

/**
 * Payment method type mappings
 */
const PAYMENT_METHOD_MAP: Record<string, MessageConfig> = {
  tax_credit: {
    id: 'energyCalculator.rebatePage.type.tax_credit',
    defaultMessage: 'Tax credit',
  },
  pos_rebate: {
    id: 'energyCalculator.rebatePage.type.pos_rebate',
    defaultMessage: 'Upfront discount',
  },
  rebate: {
    id: 'energyCalculator.rebatePage.type.rebate',
    defaultMessage: 'Rebate',
  },
  account_credit: {
    id: 'energyCalculator.rebatePage.type.account_credit',
    defaultMessage: 'Account credit',
  },
  performance_rebate: {
    id: 'energyCalculator.rebatePage.type.performance_rebate',
    defaultMessage: 'Performance rebate',
  },
  default: {
    id: 'energyCalculator.rebatePage.type.incentive',
    defaultMessage: 'Incentive',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

type RebateComponentProps = {
  rebate: EnergyCalculatorRebate;
};

/**
 * Checks if all items belong to a specific group
 */
const itemsBelongToGroup = (items: EnergyCalculatorItemType[], members: Set<EnergyCalculatorItemType>): boolean => {
  return items.every((item) => members.has(item));
};

/**
 * Gets a unified name for multiple items if they belong to a defined group
 */
const getGroupName = (items: EnergyCalculatorItemType[]): FormattedMessageType | null => {
  const matchedGroup = ITEM_GROUPS.find(({ members }) => itemsBelongToGroup(items, members));
  return matchedGroup ? <FormattedMessage {...matchedGroup.message} /> : null;
};

/**
 * Determines which page/category appears most frequently among the items
 * Returns the first page found in case of a tie
 */
const getMostFrequentPage = (items: EnergyCalculatorItemType[]): EnergyCalculatorRebateCategoryType | null => {
  const pageCounts: Partial<Record<EnergyCalculatorRebateCategoryType, number>> = {};

  // Count occurrences of each page
  for (const item of items) {
    const page = ENERGY_CALCULATOR_CATEGORY_MAP[item];
    if (page) {
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    }
  }

  // Find the page with the highest count (first one in case of tie)
  let maxPage: EnergyCalculatorRebateCategoryType | null = null;
  let maxCount = 0;

  for (const [page, count] of Object.entries(pageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxPage = page as EnergyCalculatorRebateCategoryType;
    }
  }

  return maxPage;
};

/**
 * Gets the display name for a single item
 */
const getSingleItemName = (item: EnergyCalculatorItemType): FormattedMessageType | null => {
  const config = ITEM_NAME_MAP[item];
  if (!config) {
    console.error(`No name mapping found for item: ${item}`);
    return null;
  }
  return <FormattedMessage {...config} />;
};

/**
 * Gets the display name for multiple items
 */
const getMultiItemName = (items: EnergyCalculatorItemType[]): FormattedMessageType => {
  // First, try to match a predefined group
  const groupName = getGroupName(items);
  if (groupName) {
    return groupName;
  }

  // If no group match, find the most frequent page among items
  const mostFrequentPage = getMostFrequentPage(items);
  if (mostFrequentPage) {
    const config = PAGE_TITLE_MAP[mostFrequentPage];
    return <FormattedMessage {...config} />;
  }

  // Last resort fallback
  return <FormattedMessage id="energyCalculator.rebatePage.title.itemName.multipleItems" defaultMessage="upgrades" />;
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Renders the item name for a rebate (handles single and multiple items)
 */
function ItemName({ rebate }: RebateComponentProps) {
  const items = rebate.items;

  if (items.length === 0) {
    return null;
  }

  if (items.length === 1) {
    return getSingleItemName(items[0]);
  }

  return getMultiItemName(items);
}

/**
 * Formats a unit for display
 */
const FormatUnit = ({ unit }: { unit: EnergyCalculatorAmountUnit }) => {
  const config = UNIT_MAP[unit];
  return <FormattedMessage {...config} />;
};

/**
 * Formats a title for a rebate card based on amount type
 */
export function EnergyCalculatorRebateCardTitle({ rebate }: RebateComponentProps) {
  const amount = rebate.amount;
  const itemName = <ItemName rebate={rebate} />;

  // Dollar amount rebates
  if (amount.type === 'dollar_amount') {
    const hasMax = amount.maximum !== undefined;

    return (
      <>
        {hasMax && <FormattedMessage id="energyCalculator.rebatePage.title.dollarAmount.max.1" defaultMessage="Up to $" />}
        {!hasMax && '$'}
        {(hasMax ? amount.maximum! : amount.number).toLocaleString()}
        <FormattedMessage
          id={hasMax ? 'energyCalculator.rebatePage.title.dollarAmount.max.2' : 'energyCalculator.rebatePage.title.dollarAmount.noMax.1'}
          defaultMessage=" off "
        />
        {itemName}
      </>
    );
  }

  // Percent rebates
  if (amount.type === 'percent') {
    const percentStr = `${Math.round(amount.number * 100)}%`;
    const hasMax = amount.maximum !== undefined;

    return (
      <>
        {percentStr}
        <FormattedMessage
          id={hasMax ? 'energyCalculator.rebatePage.title.percent.max.1' : 'energyCalculator.rebatePage.title.percent.noMax.1'}
          defaultMessage=" of cost of "
        />
        {itemName}
        {hasMax && (
          <>
            <FormattedMessage id="energyCalculator.rebatePage.title.percent.max.2" defaultMessage=", up to $" />
            {amount.maximum!.toLocaleString()}
          </>
        )}
      </>
    );
  }

  // Dollars per unit rebates
  if (amount.type === 'dollars_per_unit') {
    if (!amount.unit) {
      return null;
    }

    const hasMax = amount.maximum !== undefined;

    return (
      <>
        ${amount.number.toLocaleString()}/<FormatUnit unit={amount.unit} />
        <FormattedMessage
          id={hasMax ? 'energyCalculator.rebatePage.title.perUnit.max.1' : 'energyCalculator.rebatePage.title.perUnit.noMax.1'}
          defaultMessage=" off "
        />
        {itemName}
        {hasMax && (
          <>
            <FormattedMessage id="energyCalculator.rebatePage.title.perUnit.max.2" defaultMessage=", up to $" />
            {amount.maximum!.toLocaleString()}
          </>
        )}
      </>
    );
  }

  return null;
}

/**
 * Returns formatted payment method types for a rebate
 */
export function rebateTypes(rebate: EnergyCalculatorIncentive): FormattedMessageType[] {
  return rebate.payment_methods.map((method) => {
    const config = PAYMENT_METHOD_MAP[method] || PAYMENT_METHOD_MAP.default;
    return <FormattedMessage key={method} {...config} />;
  });
}

// ============================================================================
// CALCULATOR (Currently unused but kept for potential reintroduction)
// ============================================================================

type RebateSavingsCalculator = (cost: number) => number;

const createPercentCalculator = (percent: number, maxAmount = Infinity): RebateSavingsCalculator => {
  return (cost) => Math.min(cost * percent, maxAmount);
};

const createStaticAmountCalculator = (amount: number, maxAmount = Infinity): RebateSavingsCalculator => {
  return (cost) => Math.min(cost, amount, maxAmount);
};

/**
 * EnergyCalculatorRebateCalculator
 *
 * TEMPORARILY REMOVED FROM UI (at CDS partner request)
 * Previously displayed in: src/Components/EnergyCalculator/Results/RebatePage.tsx:111
 * Remains in code as CDS wanted the option to reintroduce it easily
 */
export function EnergyCalculatorRebateCalculator({ rebate }: RebateComponentProps) {
  const [cost, setCost] = useState(0);
  const translateNumber = useTranslateNumber();
  const amount = rebate.amount;

  // Determine calculator type
  let calculator: RebateSavingsCalculator;
  if (amount.type === 'percent') {
    calculator = createPercentCalculator(amount.number, amount.maximum);
  } else if (amount.type === 'dollar_amount') {
    calculator = createStaticAmountCalculator(amount.number, amount.maximum);
  } else {
    // Don't show calculator for per-unit amounts
    return null;
  }

  const formatDollarAmount = (amount: number) => translateNumber(formatToUSD(amount));
  const savings = Math.round(calculator(cost));

  return (
    <div>
      <h3>
        <FormattedMessage
          id="energyCalculator.rebatePage.calculator.title"
          defaultMessage="Estimated Savings Calculator:"
        />
      </h3>
      <QuestionDescription>
        <FormattedMessage
          id="energyCalculator.rebatePage.calculator.description"
          defaultMessage="Enter the estimated cost of the equipment or service to determine the rebate value."
        />
      </QuestionDescription>
      <div>
        <TextField
          label={
            <>
              <FormattedMessage id="energyCalculator.rebatePage.calculator.input.cost" defaultMessage="Cost of " />
              <ItemName rebate={rebate} />
            </>
          }
          variant="outlined"
          inputProps={NUM_PAD_PROPS}
          value={cost > 0 ? cost : ''}
          onChange={handleNumbersOnly((event) => {
            const value = event.target.value;
            if (value.length > 10) {
              return;
            }
            setCost(Number(value));
          })}
          sx={{ backgroundColor: '#fff', width: '18rem', maxWidth: '100%' }}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            sx: { backgroundColor: '#FFFFFF' },
          }}
        />
      </div>
      <div className="energy-calculator-rebate-page-calculator-result">
        <FormattedMessage
          id="energyCalculator.rebatePage.calculator.results.theyPay"
          defaultMessage="Rebate Reimburses: "
        />
        {formatDollarAmount(savings)}
      </div>
      <div className="energy-calculator-rebate-page-calculator-result">
        <FormattedMessage
          id="energyCalculator.rebatePage.calculator.results.youPay"
          defaultMessage="Your Net Out of Pocket: "
        />
        {formatDollarAmount(Math.max(cost - savings, 0))}
      </div>
    </div>
  );
}
