import { useExperiment } from '../../hooks/useExperiment';
import NPSFloating from './NPSFloating';
import NPSInline from './NPSInline';

type NPSWidgetProps = {
  eligibilitySnapshotId?: number;
};

/**
 * NPS Widget - renders the appropriate variant based on experiment config.
 *
 * Variants:
 * - 'floating': Bottom-right floating widget
 * - 'inline': Full-width section at bottom of results
 * - 'control': Don't show NPS (default)
 *
 * To test variants, add ?npsVariant=floating or ?npsVariant=inline to the URL
 */
export default function NPSWidget({ eligibilitySnapshotId }: NPSWidgetProps) {
  const variant = useExperiment('npsVariant', 'off');

  if (variant === 'off') {
    return null;
  }

  if (variant === 'floating') {
    return <NPSFloating eligibilitySnapshotId={eligibilitySnapshotId} />;
  }

  return <NPSInline eligibilitySnapshotId={eligibilitySnapshotId} />;
}
