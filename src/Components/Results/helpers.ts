import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Mapping of icon keys (from API/backend) to their corresponding Lucide icon names.
 * Used across CategoryHeading, ProgramPage, CurrentBenefits, and NeedCard components.
 * Keys must be lower case. Values are kebab-case Lucide icon names.
 */
export const ICON_NAME_MAP: Record<string, string> = {
  aging: 'tree-deciduous',
  baby_supplies: 'baby',
  behavioral_health: 'message-circle-heart',
  cash: 'circle-dollar-sign',
  child_care: 'blocks',
  child_development: 'shapes',
  coin: 'coins',
  dental_care: 'smile',
  disability: 'accessibility',
  family_planning: 'heart-handshake',
  food: 'apple',
  food_groceries: 'apple',
  health_care: 'square-activity',
  heart_hand: 'heart-handshake',
  housing: 'house',
  job_resources: 'briefcase-business',
  legal_services: 'scale',
  light_bulb: 'lightbulb',
  lightning: 'zap',
  managing_housing: 'house',
  savings: 'piggy-bank',
  talk: 'message-circle',
  tax_credit: 'banknote',
  transportation: 'bus-front',
  triangle_alert: 'triangle-alert',
  veteran_services: 'shield',
  youth_development: 'shapes',
  default: 'circle-dot',
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  const parsed = parsePhoneNumberFromString(phoneNumber, 'US');

  if (parsed && parsed.isValid()) {
    return parsed.formatNational();
  }

  return phoneNumber;
};

/**
 * Generates a consistent HTML ID for an urgent need based on its name
 * Used for URL anchoring and cross-component navigation between UrgentNeedBanner and NeedCard
 */
export const generateNeedId = (needName: string): string => {
  return `need-${encodeURIComponent(needName.toLowerCase())}`;
};
