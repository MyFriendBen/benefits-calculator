import { useMemo } from 'react';
import { EligibilityResults, EnhancedEligibilityResults, LifetimeProjection, LifetimeProjectionData } from '../../../Types/Results';

/**
 * Hook to determine if lifetime projections should be displayed based on language support
 * Phase 1: Only English language is supported
 */
export function useLifetimeProjectionDisplay(userLanguage: string, whiteLabel: string) {
  const shouldDisplay = useMemo(() => {
    // Phase 1: Only English supported
    const supportedLanguages = ['en'];
    return supportedLanguages.includes(userLanguage.toLowerCase());
  }, [userLanguage]);

  const getDisplayMessage = useMemo(() => {
    if (!shouldDisplay) {
      return {
        type: 'info' as const,
        message: 'Long-term benefit projections are currently available in English only. Annual estimates above are available in your preferred language.'
      };
    }
    return null;
  }, [shouldDisplay]);

  return { shouldDisplay, getDisplayMessage };
}

/**
 * Hook to extract lifetime projection data for a specific program
 */
export function useLifetimeDataForProgram(programId: string | number, lifetimeProjections?: LifetimeProjectionData): LifetimeProjection | undefined {
  return useMemo(() => {
    if (!lifetimeProjections?.available) return undefined;

    const programIdStr = String(programId);
    return lifetimeProjections.projections.find(projection => projection.program_id === programIdStr);
  }, [programId, lifetimeProjections]);
}

/**
 * Type guard to check if results contain lifetime projections
 */
export function hasLifetimeProjections(results: EligibilityResults): results is EnhancedEligibilityResults {
  return 'lifetime_projections' in results;
}

/**
 * Hook to determine if user's current language supports lifetime projections
 */
export function useLanguageSupportsLifetimeProjections(userLanguage: string): boolean {
  return useMemo(() => {
    // Phase 1: Only English supported
    const supportedLanguages = ['en'];
    return supportedLanguages.includes(userLanguage.toLowerCase());
  }, [userLanguage]);
}