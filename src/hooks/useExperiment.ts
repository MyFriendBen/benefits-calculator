import { useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Context } from '../Components/Wrapper/Wrapper';

export type NPSVariant = 'floating' | 'inline' | 'off';

type ExperimentsConfig = {
  npsVariant?: {
    default: NPSVariant;
    [key: string]: NPSVariant | undefined;
  };
};

const STORAGE_PREFIX = 'experiment_override_';

const VALID_NPS_VARIANTS: NPSVariant[] = ['floating', 'inline', 'off'];

/**
 * Hook for A/B test experiments with override support for testing.
 *
 * Priority order:
 * 1. URL parameter (e.g., ?npsVariant=floating)
 * 2. localStorage override (for persistent testing)
 * 3. Backend config via experiments config
 *
 * To test variants:
 * - URL: Add ?npsVariant=floating or ?npsVariant=inline to the URL
 * - localStorage: localStorage.setItem('experiment_override_npsVariant', 'floating')
 * - Clear override: localStorage.removeItem('experiment_override_npsVariant')
 */
export function useExperiment(
  experimentName: 'npsVariant',
  defaultValue: NPSVariant,
): NPSVariant {
  const { config } = useContext(Context);
  const [searchParams] = useSearchParams();

  const variant = useMemo(() => {
    // 1. Check URL parameter first (highest priority)
    const urlOverride = searchParams.get(experimentName);
    if (urlOverride && VALID_NPS_VARIANTS.includes(urlOverride as NPSVariant)) {
      return urlOverride as NPSVariant;
    }

    // 2. Check localStorage override
    const storageKey = `${STORAGE_PREFIX}${experimentName}`;
    const localOverride = localStorage.getItem(storageKey);
    if (localOverride && VALID_NPS_VARIANTS.includes(localOverride as NPSVariant)) {
      return localOverride as NPSVariant;
    }

    // 3. Fall back to backend experiments config
    try {
      const experiments = config?.experiments as ExperimentsConfig | undefined;
      const experimentConfig = experiments?.[experimentName];
      if (experimentConfig) {
        return experimentConfig.default ?? defaultValue;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }, [experimentName, defaultValue, config, searchParams]);

  return variant;
}

/**
 * Helper to set a persistent experiment override (for dev/QA use)
 */
export function setExperimentOverride(experimentName: 'npsVariant', value: NPSVariant): void {
  localStorage.setItem(`${STORAGE_PREFIX}${experimentName}`, value);
}

/**
 * Helper to clear an experiment override
 */
export function clearExperimentOverride(experimentName: 'npsVariant'): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${experimentName}`);
}
