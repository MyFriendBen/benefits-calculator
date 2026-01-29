import { useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Context } from '../Components/Wrapper/Wrapper';
import { NPSVariant } from '../Components/Referrer/referrerHook';

const STORAGE_PREFIX = 'experiment_override_';

const VALID_NPS_VARIANTS: NPSVariant[] = ['floating', 'inline', 'off'];

/**
 * Hook for NPS A/B test experiment with override support for testing.
 *
 * Priority order:
 * 1. URL parameter (e.g., ?npsVariant=floating)
 * 2. localStorage override (for persistent testing)
 * 3. Backend config via getReferrer
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
  const { getReferrer } = useContext(Context);
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

    // 3. Fall back to backend config
    try {
      return getReferrer('npsVariant', defaultValue);
    } catch {
      return defaultValue;
    }
  }, [experimentName, defaultValue, getReferrer, searchParams]);

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
