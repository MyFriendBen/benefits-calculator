import { FormattedMessage } from 'react-intl';
import { useConfig } from '../../../Config/configHook';
import { FormattedMessageType } from '../../../../Types/Questions';
import { HealthInsuranceOptions, ConditionOptions } from '../utils/types';
import { sortFrequencyOptions } from '../utils/helpers';
import { createMenuItems } from '../../SelectHelperFunctions/SelectHelperFunctions';

/**
 * Custom hook that encapsulates all config-related data for household members
 * Reduces component complexity by centralizing configuration access
 */
export const useHouseholdMemberConfig = () => {
  const healthInsuranceOptions = useConfig<HealthInsuranceOptions>('health_insurance_options');
  const conditionOptions = useConfig<ConditionOptions>('condition_options');
  const incomeOptions = useConfig<Record<string, FormattedMessageType>>('income_options');
  const frequencyOptions = useConfig<Record<string, FormattedMessageType>>('frequency_options');
  const relationshipOptions = useConfig<Record<string, FormattedMessageType>>('relationship_options');

  const sortedFrequencyOptions = sortFrequencyOptions(frequencyOptions);
  const frequencyMenuItems = createMenuItems(
    sortedFrequencyOptions,
    <FormattedMessage id="personIncomeBlock.createFrequencyMenuItems-disabledSelectMenuItem" defaultMessage="Select" />,
  ).flat();

  return {
    healthInsuranceOptions,
    conditionOptions,
    incomeOptions,
    frequencyMenuItems,
    relationshipOptions,
  };
};
