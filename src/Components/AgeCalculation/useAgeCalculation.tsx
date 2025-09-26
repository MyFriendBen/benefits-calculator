import { useCallback } from 'react';
import { UseFormWatch, FieldValues } from 'react-hook-form';
import { calculateAgeStatus, AgeCalculationResult } from './AgeCalculation';

interface BirthDateFields {
  birthMonth?: string | number;
  birthYear?: string | number;
}

/**
 * Hook for calculating age status in forms
 * @param watch - React Hook Form watch function
 * @returns Function to calculate age status from current form values
 */
export function useAgeCalculation<T extends FieldValues & BirthDateFields>(
  watch: UseFormWatch<T>
) {
  const calculateCurrentAgeStatus = useCallback((): AgeCalculationResult => {
    const formValues = watch();
    return calculateAgeStatus(formValues.birthMonth, formValues.birthYear);
  }, [watch]);

  return { calculateCurrentAgeStatus };
}