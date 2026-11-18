import { useConfig } from '../../Config/configHook';
import { FormattedMessageType } from '../../../Types/Questions';

/**
 * The badge for each navigator language code, served by benefits-api (`navigator_language_options`,
 * from `NavigatorLanguageCode` in programs/allowed_values.py). A code with no badge isn't shown.
 */
export function useNavigatorLanguageBadges(): Record<string, FormattedMessageType> {
  return useConfig<Record<string, FormattedMessageType>>('navigator_language_options', {});
}
