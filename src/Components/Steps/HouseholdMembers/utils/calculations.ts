import { FormattedMessageType } from '../../../Types/Questions';
import { FREQUENCY_ORDER } from './constants';

/**
 * Sorts frequency options from least frequent to most frequent
 */
export const sortFrequencyOptions = (
  frequencyOptions: Record<string, FormattedMessageType>
): Record<string, FormattedMessageType> => {
  return Object.fromEntries([
    ...FREQUENCY_ORDER
      .filter(key => frequencyOptions[key])
      .map(key => [key, frequencyOptions[key]]),
    ...Object.entries(frequencyOptions)
      .filter(([key]) => !FREQUENCY_ORDER.includes(key))
  ]);
};

/**
 * Calculates age from birth year and month
 */
export const calculateAge = (birthYear?: number, birthMonth?: number): number | null => {
  if (!birthYear || !birthMonth) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 0-indexed

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth) {
    age--;
  }
  return age;
};
