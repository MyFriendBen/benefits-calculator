import { useEffect } from 'react';
import { setCampaign } from './campaign';
import useUtmParameters from './useUtmParameters';

// Reads UTM parameters from URL and saves to session storage
export default function useCampaign() {
  const utmParameters = useUtmParameters();
  useEffect(() => {
    if (utmParameters) {
      setCampaign(utmParameters);
    }
  }, [utmParameters]);
}
