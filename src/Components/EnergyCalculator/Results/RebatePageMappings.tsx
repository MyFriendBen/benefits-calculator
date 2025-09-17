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
} from './rebateTypes';
import QuestionDescription from '../../QuestionComponents/QuestionDescription';

type ItemGroup = 'air_source_heat_pump' | 'clothes_dryer' | 'generic_heat_pump' | 'water_heater';

/**
 * Some incentives are for multiple items. These groups define headlines for
 * such incentives: if the incentive's items are a subset of one of these
 * groups, it will be shown with a unified name.
 *
 * Note that the groups are checked in order, so if one group is a subset of
 * another, the smaller group should be listed first. (E.g. air source heat
 * pumps and generic heat pumps.)
 */
const ITEM_GROUPS: { group: ItemGroup; members: Set<EnergyCalculatorItemType> }[] = [
  {
    group: 'air_source_heat_pump',
    members: new Set(['ducted_heat_pump', 'ductless_heat_pump', 'air_to_water_heat_pump']),
  },
  {
    group: 'clothes_dryer',
    members: new Set(['heat_pump_clothes_dryer', 'non_heat_pump_clothes_dryer']),
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
  },
  {
    group: 'water_heater',
    members: new Set(['heat_pump_water_heater', 'non_heat_pump_water_heater']),
  },
];

const itemsBelongToGroup = (items: EnergyCalculatorItemType[], members: Set<EnergyCalculatorItemType>) => {
  return items.every((i) => members.has(i));
};

const multipleItemsName = (items: EnergyCalculatorItemType[]) => {
  // For a multiple-items case, check whether all the items are in one of the
  // defined groups.
  for (const { group, members } of ITEM_GROUPS) {
    if (itemsBelongToGroup(items, members)) {
      switch (group) {
        case 'air_source_heat_pump':
          return (
            <FormattedMessage
              id="energyCalculator.rebatePage.title.itemName.airSourceHeatPump"
              defaultMessage="an air source heat pump"
            />
          );
        case 'clothes_dryer':
          return (
            <FormattedMessage
              id="energyCalculator.rebatePage.title.itemName.clothesDryer"
              defaultMessage="a clothes dryer"
            />
          );
        case 'generic_heat_pump':
          return (
            <FormattedMessage
              id="energyCalculator.rebatePage.title.itemName.genericHeatPump"
              defaultMessage="a heat pump"
            />
          );
        case 'water_heater':
          return (
            <FormattedMessage
              id="energyCalculator.rebatePage.title.itemName.waterHeater"
              defaultMessage="a water heater"
            />
          );
        default: {
          // This will be a type error if the above switch is not exhaustive
          const unknownGroup: never = group;
          console.error(`no name for ${unknownGroup}`);
        }
      }
    }
  }

  return null;
};

type RebateComponentProps = {
  rebate: EnergyCalculatorRebate;
};

function ItemName({ rebate }: RebateComponentProps) {
  const itemsToRender = rebate.items;

  if (itemsToRender.length > 1) {
    return multipleItemsName(itemsToRender);
  }

  if (itemsToRender.length !== 1) {
    return null;
  }

  const item = itemsToRender[0];
  switch (item) {
    case 'air_to_water_heat_pump':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.airToWaterHeatPump"
          defaultMessage="an air-to-water heat pump"
        />
      );
    case 'central_air_conditioner':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.centralAirConditioner"
          defaultMessage="a central air conditioner"
        />
      );
    case 'ducted_heat_pump':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.ductedHeatPump"
          defaultMessage="a ducted heat pump"
        />
      );
    case 'ductless_heat_pump':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.ductlessHeatPump"
          defaultMessage="a ductless heat pump"
        />
      );
    case 'electric_stove':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.electricStove"
          defaultMessage="an electric/induction stove"
        />
      );
    case 'geothermal_heating_installation':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.geothermalHeatingInstallation"
          defaultMessage="geothermal heating installation"
        />
      );
    case 'heat_pump_clothes_dryer':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.heatPumpClothesDryer"
          defaultMessage="a heat pump clothes dryer"
        />
      );
    case 'heat_pump_water_heater':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.heatPumpWaterHeater"
          defaultMessage="a heat pump water heater"
        />
      );
    case 'non_heat_pump_clothes_dryer':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.nonHeatPumpClothesDryer"
          defaultMessage="an electric clothes dryer"
        />
      );
    case 'non_heat_pump_water_heater':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.nonHeatPumpWaterHeater"
          defaultMessage="an electric water heater"
        />
      );
    case 'other_heat_pump':
      return (
        <FormattedMessage id="energyCalculator.rebatePage.title.itemName.otherHeatPump" defaultMessage="a heat pump" />
      );
    case 'rooftop_solar_installation':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.rooftopSolarInstallation"
          defaultMessage="rooftop solar installation"
        />
      );
    case 'battery_storage_installation':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.batteryStorageInstallation"
          defaultMessage="battery storage installation"
        />
      );
    case 'electric_wiring':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.electricWiring"
          defaultMessage="electric wiring"
        />
      );
    case 'electric_panel':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.electricPanel"
          defaultMessage="electric panel upgrade"
        />
      );
    case 'smart_thermostat':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.smartThermostat"
          defaultMessage="a smart thermostat"
        />
      );
    case 'electric_outdoor_equipment':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.electricOutdoorEquipment"
          defaultMessage="electric outdoor equipment"
        />
      );
    case 'energy_audit':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.itemName.energyAudit"
          defaultMessage="an energy audit"
        />
      );
    default: {
      // This will be a type error if the above if-else is not exhaustive
      const unknownItem: never = item;
      console.error(`no name for item ${unknownItem}`);
      return null;
    }
  }
}

type FormatUnitProps = {
  unit: EnergyCalculatorAmountUnit;
};

const FormatUnit = ({ unit }: FormatUnitProps) => {
  switch (unit) {
    case 'btuh10k':
      return (
        <FormattedMessage id="energyCalculator.rebatePage.title.amountUnit.btuh10k" defaultMessage="10,000 Btuh" />
      );
    case 'kilowatt':
      return <FormattedMessage id="energyCalculator.rebatePage.title.amountUnit.kilowatt" defaultMessage="kilowatt" />;
    case 'kilowatt_hour':
      return (
        <FormattedMessage
          id="energyCalculator.rebatePage.title.amountUnit.kilowattHour"
          defaultMessage="kilowatt-hour"
        />
      );
    case 'square_foot':
      return (
        <FormattedMessage id="energyCalculator.rebatePage.title.amountUnit.squareFoot" defaultMessage="square foot" />
      );
    case 'ton':
      return <FormattedMessage id="energyCalculator.rebatePage.title.amountUnit.ton" defaultMessage="ton" />;
    case 'watt':
      return <FormattedMessage id="energyCalculator.rebatePage.title.amountUnit.watt" defaultMessage="watt" />;
  }
};

export function EnergyCalculatorRebateCardTitle({ rebate }: RebateComponentProps) {
  const amount = rebate.amount;
  if (amount.type === 'dollar_amount') {
    if (amount.maximum !== undefined) {
      return (
        <>
          <FormattedMessage id="energyCalculator.rebatePage.title.dollarAmount.max.1" defaultMessage="Up to $" />
          {amount.maximum.toLocaleString()}
          <FormattedMessage id="energyCalculator.rebatePage.title.dollarAmount.max.2" defaultMessage=" off " />
          <ItemName rebate={rebate} />
        </>
      );
    }
    return (
      <>
        ${amount.number.toLocaleString()}
        <FormattedMessage id="energyCalculator.rebatePage.title.dollarAmount.noMax.1" defaultMessage=" off " />
        <ItemName rebate={rebate} />
      </>
    );
  } else if (amount.type === 'percent') {
    const percentStr = `${Math.round(amount.number * 100)}%`;
    if (amount.maximum !== undefined) {
      return (
        <>
          {percentStr}
          <FormattedMessage id="energyCalculator.rebatePage.title.percent.max.1" defaultMessage=" of cost of " />
          <ItemName rebate={rebate} />
          <FormattedMessage id="energyCalculator.rebatePage.title.percent.max.2" defaultMessage=", up to $" />
          {amount.maximum.toLocaleString()}
        </>
      );
    }
    return (
      <>
        {percentStr}
        <FormattedMessage id="energyCalculator.rebatePage.title.percent.noMax.1" defaultMessage=" of cost of " />
        <ItemName rebate={rebate} />
      </>
    );
  } else if (amount.type === 'dollars_per_unit') {
    if (amount.unit === undefined) {
      return null;
    }

    if (amount.maximum !== undefined) {
      return (
        <>
          ${amount.number.toLocaleString()}/<FormatUnit unit={amount.unit} />
          <FormattedMessage id="energyCalculator.rebatePage.title.perUnit.max.1" defaultMessage=" off " />
          <ItemName rebate={rebate} />
          <FormattedMessage id="energyCalculator.rebatePage.title.perUnit.max.2" defaultMessage=", up to $" />
          {amount.maximum.toLocaleString()}
        </>
      );
    }

    return (
      <>
        ${amount.number.toLocaleString()}/<FormatUnit unit={amount.unit} />
        <FormattedMessage id="energyCalculator.rebatePage.title.perUnit.noMax.1" defaultMessage=" off " />
        <ItemName rebate={rebate} />
      </>
    );
  }

  return null;
}

export function rebateTypes(rebate: EnergyCalculatorIncentive) {
  const types: FormattedMessageType[] = [];
  for (const method of rebate.payment_methods) {
    if (method === 'tax_credit') {
      types.push(<FormattedMessage id="energyCalculator.rebatePage.type.tax_credit" defaultMessage="Tax credit" />);
    } else if (method === 'pos_rebate') {
      types.push(
        <FormattedMessage id="energyCalculator.rebatePage.type.pos_rebate" defaultMessage="Upfront discount" />,
      );
    } else if (method === 'rebate') {
      types.push(<FormattedMessage id="energyCalculator.rebatePage.type.rebate" defaultMessage="Rebate" />);
    } else if (method === 'account_credit') {
      types.push(
        <FormattedMessage id="energyCalculator.rebatePage.type.account_credit" defaultMessage="Account credit" />,
      );
    } else if (method === 'performance_rebate') {
      types.push(
        <FormattedMessage
          id="energyCalculator.rebatePage.type.performance_rebate"
          defaultMessage="Performance rebate"
        />,
      );
    } else {
      types.push(<FormattedMessage id="energyCalculator.rebatePage.type.incentive" defaultMessage="Incentive" />);
    }
  }

  return types;
}

type RebateSavingsCalculator = (cost: number) => number;

function percentSavingCalculatorGenerator(percent: number, maxAmount: number = Infinity): RebateSavingsCalculator {
  return (cost) => {
    return Math.min(cost * percent, maxAmount);
  };
}
function staticAmountSavingCalculatorGenerator(amount: number, maxAmount: number = Infinity): RebateSavingsCalculator {
  return (cost) => {
    return Math.min(cost, amount, maxAmount);
  };
}

export function EnergyCalculatorRebateCalculator({ rebate }: RebateComponentProps) {
  const [cost, setCost] = useState(0);
  const translateNumber = useTranslateNumber();

  let calculator: RebateSavingsCalculator;

  const amount = rebate.amount;
  if (amount.type === 'percent') {
    calculator = percentSavingCalculatorGenerator(amount.number, amount.maximum);
  } else if (amount.type === 'dollar_amount') {
    calculator = staticAmountSavingCalculatorGenerator(amount.number, amount.maximum);
  } else {
    // don't add a calculator for the per unit amounts
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
