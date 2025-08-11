import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setCampaign } from './campaign';
import useUtmParameters, { UtmKeys } from './useUtmParameters';

const useRemoveUtmParams = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    const params = new URLSearchParams(location.search);
    UtmKeys.forEach((param) => params.delete(param));

    const newUrl = `${location.pathname}${params.toString() ? `?${params}` : ''}`;
    navigate(newUrl, { replace: true });
  };
};

// Pulls the utm parameters, saves, and removes from the URL
export default function useCampaign() {
  const utmParameters = useUtmParameters();
  const removeUtmParams = useRemoveUtmParams();
  useEffect(() => {
    if (utmParameters) {
      setCampaign(utmParameters);
      removeUtmParams();
    }
  }, [utmParameters, removeUtmParams]);
}
