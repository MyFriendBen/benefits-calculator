import { useContext, useEffect } from 'react';
import { EnergyCalculatorFormData, FormData } from '../../Types/FormData';
import { Context } from '../Wrapper/Wrapper';

// initialize the energy calculator form data for the energy calulator steps
// return a boolean for when the energy data is set up
export function useEnergyFormData(
  formData: FormData,
): formData is FormData & Required<Pick<FormData, 'energyCalculator'>> {
  const { setFormData } = useContext(Context);

  const energyCalculatorNeedsInit = formData.energyCalculator === undefined;

  useEffect(() => {
    if (!energyCalculatorNeedsInit) {
      return;
    }

    setFormData((prevFormData) => {
      if (prevFormData.energyCalculator !== undefined) {
        return prevFormData;
      }

      const initialEnergyCalculator: EnergyCalculatorFormData = {
        isRenter: prevFormData.path === 'renter',
        isHomeOwner: prevFormData.path !== 'renter',
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

      return { ...prevFormData, energyCalculator: initialEnergyCalculator };
    });
  }, [energyCalculatorNeedsInit, setFormData]);

  return formData.energyCalculator !== undefined;
}

export function useIsEnergyCalculator() {
  const { whiteLabel } = useContext(Context);

  return whiteLabel === 'cesn';
}
