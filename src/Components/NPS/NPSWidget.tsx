import { useExperiment } from '../../hooks/useExperiment';
import { useFeatureFlag } from '../Config/configHook';
import NPSFloating from './NPSFloating';
import NPSInline from './NPSInline';

type NPSWidgetProps = {
  uuid?: string;
};

/**
 * NPS Widget - renders the appropriate variant based on feature flag and experiment config.
 *
 * Gating:
 * - Feature flag 'nps_survey' must be enabled (top-level kill switch)
 * - Experiment 'npsVariant' controls which UI variant to show
 *
 * Variants:
 * - 'floating': Bottom-right floating widget
 * - 'inline': Full-width section at bottom of results
 * - 'off': Don't show NPS (default, used by white labels that opt out)
 *
 * To test variants, add ?npsVariant=floating or ?npsVariant=inline to the URL
 */
export default function NPSWidget({ uuid }: NPSWidgetProps) {
  const isNPSEnabled = useFeatureFlag('nps_survey');
  const variant = useExperiment('npsVariant', 'off');

  if (!isNPSEnabled || variant === 'off') {
    return null;
  }

  if (variant === 'floating') {
    return <NPSFloating uuid={uuid} />;
  }

  return <NPSInline uuid={uuid} />;
}
