import { useEffect } from 'react';
import { setCampaign } from './campaign';
import useUtmParameters from './useUtmParameters';

// Pulls the utm parameters, saves, and removes from the URL
export default function useCampaign() {
  const utmParameters = useUtmParameters();
  useEffect(() => {
    if (utmParameters) {
      setCampaign(utmParameters);
    }
  }, [utmParameters]);
}
