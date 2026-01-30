import { useExperiment } from '../../hooks/useExperiment';
import NPSFloating from './NPSFloating';
import NPSInline from './NPSInline';

type NPSWidgetProps = {
  uuid?: string;
};

/**
 * NPS Widget - renders the appropriate variant based on experiment config.
 *
 * Variants:
 * - 'floating': Bottom-right floating widget
 * - 'inline': Full-width section at bottom of results
 * - 'off': Don't show NPS (default, used by white labels that opt out)
 *
 * To test variants, add ?npsVariant=floating or ?npsVariant=inline to the URL
 */
export default function NPSWidget({ uuid }: NPSWidgetProps) {
  const variant = useExperiment('npsVariant', 'off');

  if (variant === 'off') {
    return null;
  }

  if (variant === 'floating') {
    return <NPSFloating uuid={uuid} />;
  }

  return <NPSInline uuid={uuid} />;
}
