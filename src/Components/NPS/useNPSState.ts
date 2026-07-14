import { useState } from 'react';
import { postNPSScore, patchNPSReason } from '../../apiCalls';
import { useTrackEvent } from '../../Assets/analytics';

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
 * Shared hook for NPS state management.
 * Handles score selection, followup reason, and API calls.
 *
 * Flow: select score (POST) → enter reason → submit reason (PATCH) → thank you
 */
export function useNPSState(uuid?: string): UseNPSStateReturn {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [isFullySubmitted, setIsFullySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const track = useTrackEvent();

  const submitScore = (score: number) => {
    setSelectedScore(score);
    setIsScoreSubmitted(true);
    track('screener_nps_score_submitted', { score });

    if (uuid) {
      postNPSScore({ uuid, score }).catch((error) => {
        console.error('Failed to submit NPS score:', error);
      });
    }
  };

  const submitReason = () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setIsFullySubmitted(true);

    if (uuid && reason.trim()) {
      // Only count a reason as submitted when there's actually a reason stored;
      // an empty-reason submit is effectively a skip.
      track('screener_nps_reason_submitted', {});
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
    track('screener_nps_reason_skipped', {});
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
