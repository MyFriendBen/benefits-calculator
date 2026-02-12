import { useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Context } from '../Components/Wrapper/Wrapper';

type ExperimentConfig = {
  variants: string[];
};

type ExperimentsConfig = Record<string, ExperimentConfig>;

const STORAGE_PREFIX = 'experiment_override_';

/**
 * Simple deterministic hash (djb2) for splitting users into variant buckets.
 * Same input always produces the same output.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Hook for A/B test experiments with deterministic variant assignment.
 *
 * Uses a seed (typically uuid) to deterministically assign users to variants
 * defined in backend config. Same seed always gets the same variant.
 *
 * Priority:
 * 1. URL parameter override (e.g., ?npsVariant=floating)
 * 2. localStorage override (for persistent dev/QA testing)
 * 3. Backend config variants + seed-based deterministic assignment
 *
 * @param experimentName - The experiment key in backend config (e.g., 'npsVariant')
 * @param seed - Stable identifier (e.g., uuid) for deterministic assignment
 * @returns The assigned variant string, or null if not configured/assigned
 *
 * To test variants:
 * - URL: ?npsVariant=floating or ?npsVariant=inline
 * - localStorage: localStorage.setItem('experiment_override_npsVariant', 'floating')
 * - Clear: localStorage.removeItem('experiment_override_npsVariant')
 */
export function useExperiment(experimentName: string, seed?: string): string | null {
  const { config } = useContext(Context);
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const experiments = config?.experiments as ExperimentsConfig | undefined;
    const variants = experiments?.[experimentName]?.variants;

    // 1. URL parameter override (highest priority)
    const urlOverride = searchParams.get(experimentName);
    if (urlOverride) {
      if (!variants || variants.includes(urlOverride)) {
        return urlOverride;
      }
    }

    // 2. localStorage override
    try {
      const storageKey = `${STORAGE_PREFIX}${experimentName}`;
      const localOverride = localStorage.getItem(storageKey);
      if (localOverride) {
        if (!variants || variants.includes(localOverride)) {
          return localOverride;
        }
      }
    } catch {
      // localStorage may be unavailable in private browsing
    }

    // 3. Backend config + seed-based deterministic assignment
    if (variants && variants.length > 0 && seed) {
      const index = hashString(seed) % variants.length;
      return variants[index];
    }

    return null;
  }, [experimentName, seed, config, searchParams]);
}

/**
 * Helper to set a persistent experiment override (for dev/QA use).
 */
export function setExperimentOverride(experimentName: string, value: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${experimentName}`, value);
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

/**
 * Helper to clear an experiment override.
 */
export function clearExperimentOverride(experimentName: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${experimentName}`);
  } catch {
    // localStorage may be unavailable in private browsing
  }
}
