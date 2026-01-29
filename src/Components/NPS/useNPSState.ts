import { useState } from 'react';
import { postNPSScore } from '../../apiCalls';

export type NPSVariantType = 'floating' | 'inline';

type UseNPSStateReturn = {
  selectedScore: number | null;
  isSubmitted: boolean;
  submitScore: (score: number) => void;
};

/**
 * Shared hook for NPS state management across variants.
 * Handles score selection, submission state, and API calls.
 */
export function useNPSState(variant: NPSVariantType, uuid?: string): UseNPSStateReturn {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitScore = (score: number) => {
    setSelectedScore(score);
    setIsSubmitted(true);

    // Fire-and-forget API call - don't block the thank you message
    if (uuid) {
      postNPSScore({ uuid, score, variant }).catch((error) => {
        console.error('Failed to submit NPS score:', error);
      });
    }
  };

  return { selectedScore, isSubmitted, submitScore };
}
