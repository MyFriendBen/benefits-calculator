import { useState } from 'react';
import { postNPSScore, patchNPSReason } from '../../apiCalls';

export type NPSVariantType = 'floating' | 'inline';

type UseNPSStateReturn = {
  selectedScore: number | null;
  isScoreSubmitted: boolean;
  isFullySubmitted: boolean;
  isSubmitting: boolean;
  reason: string;
  setReason: (reason: string) => void;
  submitScore: (score: number) => void;
  submitReason: () => void;
  skipReason: () => void;
};

/**
 * Shared hook for NPS state management across variants.
 * Handles score selection, followup reason, and API calls.
 *
 * Flow: select score (POST) → enter reason → submit reason (PATCH) → thank you
 */
export function useNPSState(variant: NPSVariantType, uuid?: string): UseNPSStateReturn {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [isFullySubmitted, setIsFullySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  const submitScore = (score: number) => {
    setSelectedScore(score);
    setIsScoreSubmitted(true);

    if (uuid) {
      postNPSScore({ uuid, score, variant }).catch((error) => {
        console.error('Failed to submit NPS score:', error);
      });
    }
  };

  const submitReason = () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setIsFullySubmitted(true);

    if (uuid && reason.trim()) {
      patchNPSReason({ uuid, score_reason: reason.trim() })
        .catch((error) => {
          console.error('Failed to submit NPS reason:', error);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      setIsSubmitting(false);
    }
  };

  const skipReason = () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    setIsFullySubmitted(true);
    setIsSubmitting(false);
  };

  return {
    selectedScore,
    isScoreSubmitted,
    isFullySubmitted,
    isSubmitting,
    reason,
    setReason,
    submitScore,
    submitReason,
    skipReason,
  };
}
