const ITEM_NAME = 'UTM_CAMPAIGN';
import { UtmParameters } from './useUtmParameters';

export function getCampaign() {
  const campaign = sessionStorage.getItem(ITEM_NAME);
  if (!campaign) {
    return null;
  }

  try {
    return JSON.parse(campaign) as UtmParameters;
  } catch (error) {
    console.error('Error parsing campaign data from sessionStorage:', error);
    return null;
  }
}

export function setCampaign(utmParameters: UtmParameters) {
  const campaign = sessionStorage.getItem(ITEM_NAME);
  if (!campaign) {
    sessionStorage.setItem(ITEM_NAME, JSON.stringify(utmParameters));
  } else {
    console.warn('Campaign already exists in sessionStorage. Not overwriting.');
  }
}
