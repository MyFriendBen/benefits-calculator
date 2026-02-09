import { useContext, useEffect } from 'react';
import { EnergyCalculatorFormData, FormData } from '../../Types/FormData';
import { Context } from '../Wrapper/Wrapper';

// initialize the energy calculator form data for the energy calulator steps
// return a boolean for when the energy data is set up
export function useEnergyFormData(
  formData: FormData,
): formData is FormData & Required<Pick<FormData, 'energyCalculator'>> {
  const { setFormData } = useContext(Context);

  useEffect(() => {
    if (formData.energyCalculator === undefined) {
      const initialEnergyCalculator: EnergyCalculatorFormData = {
        isRenter: formData.path === 'renter',
        isHomeOwner: formData.path !== 'renter',
        electricProvider: '',
        electricProviderName: '',
        gasProvider: '',
        gasProviderName: '',
        electricityIsDisconnected: false,
        hasPastDueEnergyBills: false,
        hasOldCar: false,
        needsHvac: false,
        needsStove: false,
        needsWaterHeater: false,
      };

      setFormData({ ...formData, energyCalculator: initialEnergyCalculator });
    }
  }, [formData.energyCalculator === undefined]);

  return formData.energyCalculator !== undefined;
}

export function useIsEnergyCalculator() {
  const { whiteLabel } = useContext(Context);

  return whiteLabel === 'co_energy_calculator';
}
