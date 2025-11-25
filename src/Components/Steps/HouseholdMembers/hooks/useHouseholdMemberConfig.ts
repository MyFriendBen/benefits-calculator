import { useConfig } from '../../../Config/configHook';
import { FormattedMessageType } from '../../../../Types/Questions';
import { HealthInsuranceOptions, ConditionOptions } from '../utils/types';

/**
 * Custom hook that encapsulates all config-related data for household members
 * Reduces component complexity by centralizing configuration access
 */
export const useHouseholdMemberConfig = () => {
  const healthInsuranceOptions = useConfig<HealthInsuranceOptions>('health_insurance_options');
  const conditionOptions = useConfig<ConditionOptions>('condition_options');
  const incomeCategories = useConfig<Record<string, FormattedMessageType>>('income_categories');
  const incomeOptions = useConfig<Record<string, Record<string, FormattedMessageType>>>('income_options');
  const frequencyOptions = useConfig<Record<string, FormattedMessageType>>('frequency_options');
  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');

  return {
    healthInsuranceOptions,
    conditionOptions,
    incomeCategories,
    incomeOptions,
    frequencyOptions,
    relationshipOptions,
  };
};
