import type { ComponentType, SVGProps } from 'react';
import { ReactComponent as Food } from '../../Assets/icons/UrgentNeeds/AcuteConditions/food.svg';
import { ReactComponent as Residence } from '../../Assets/icons/General/residence.svg';
import { ReactComponent as HealthCare } from '../../Assets/icons/Programs/CategoryHeading/healthcare.svg';
import { ReactComponent as Transportation } from '../../Assets/icons/Programs/CategoryHeading/transportation.svg';
import { ReactComponent as TaxCredits } from '../../Assets/icons/Programs/CategoryHeading/taxCredits.svg';
import { ReactComponent as CashAssistance } from '../../Assets/icons/Programs/CategoryHeading/cashAssistant.svg';
import { ReactComponent as ChildCareYouthEducation } from '../../Assets/icons/Programs/CategoryHeading/childCareYouthEducation.svg';
import { ReactComponent as Coin } from '../EnergyCalculator/Icons/Coin.svg';
import { ReactComponent as LightBulb } from '../EnergyCalculator/Icons/Lightbulb.svg';
import { ReactComponent as Talk } from '../EnergyCalculator/Icons/Messages.svg';
import { ReactComponent as TriangleAlert } from '../EnergyCalculator/Icons/TriangleAlert.svg';
import { ReactComponent as Lightning } from '../EnergyCalculator/Icons/Lightning.svg';
import { ReactComponent as HeartHand } from '../EnergyCalculator/Icons/HeartHand.svg';
import { ReactComponent as BabySupplies } from '../../Assets/icons/UrgentNeeds/AcuteConditions/baby_supplies.svg';
import { ReactComponent as ChildDevelopment } from '../../Assets/icons/UrgentNeeds/AcuteConditions/child_development.svg';
import { ReactComponent as DentalCare } from '../../Assets/icons/UrgentNeeds/AcuteConditions/dental_care.svg';
import { ReactComponent as FamilyPlanning } from '../../Assets/icons/UrgentNeeds/AcuteConditions/family_planning.svg';
import { ReactComponent as Housing } from '../../Assets/icons/UrgentNeeds/AcuteConditions/housing.svg';
import { ReactComponent as JobResources } from '../../Assets/icons/UrgentNeeds/AcuteConditions/job_resources.svg';
import { ReactComponent as LegalServices } from '../../Assets/icons/UrgentNeeds/AcuteConditions/legal_services.svg';
import { ReactComponent as Support } from '../../Assets/icons/UrgentNeeds/AcuteConditions/support.svg';
import { ReactComponent as Military } from '../../Assets/icons/UrgentNeeds/AcuteConditions/military.svg';
import { ReactComponent as Resources } from '../../Assets/icons/General/resources.svg';

/**
 * List of lucide-based icon names that require special styling (white fill with colored stroke)
 * Used across CategoryHeading and ProgramPage components
 */
export const LUCIDE_ICONS = ['house_plug', 'light_bulb', 'talk', 'air_vent', 'coin', 'heart_hand', 'lightning', 'triangle_alert'];

/**
 * Mapping of icon keys (from API/backend) to their corresponding React SVG components
 * Used across CategoryHeading, ProgramPage, and CurrentBenefits components
 * NOTE: keys must be lower case
 */
export const ICON_OPTIONS_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  baby_supplies: BabySupplies,
  behavioral_health: Support,
  cash: CashAssistance,
  coin: Coin,
  child_care: ChildCareYouthEducation,
  child_development: ChildDevelopment,
  dental_care: DentalCare,
  family_planning: FamilyPlanning,
  food: Food,
  food_groceries: Food,
  health_care: HealthCare,
  heart_hand: HeartHand,
  housing: Residence,
  job_resources: JobResources,
  legal_services: LegalServices,
  light_bulb: LightBulb,
  lightning: Lightning,
  managing_housing: Housing,
  savings: Resources,
  talk: Talk,
  tax_credit: TaxCredits,
  transportation: Transportation,
  triangle_alert: TriangleAlert,
  veteran_services: Military,
  default: CashAssistance,
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters except leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // Handle international format: +1XXXXXXXXXX (14 chars with +1)
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }

  // Handle 10-digit US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Handle 11-digit US number (with leading 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if format doesn't match expected patterns
  return phoneNumber;
};

/**
 * Generates a consistent HTML ID for an urgent need based on its name
 * Used for URL anchoring and cross-component navigation between UrgentNeedBanner and NeedCard
 */
export const generateNeedId = (needName: string): string => {
  return `need-${encodeURIComponent(needName.toLowerCase())}`;
};
