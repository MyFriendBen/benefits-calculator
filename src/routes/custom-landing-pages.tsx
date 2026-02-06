import { ComponentType } from 'react';
import JeffcoLandingPage from '../Components/JeffcoComponents/JeffcoLandingPage/JeffcoLandingPage';
import CcigLandingPage from '../Components/CcigComponents/CcigLandingPage';
import EnergyCalculatorLandingPage from '../Components/EnergyCalculator/LandingPage/LandingPage';

/**
 * Configuration for custom landing pages for partner integrations.
 * These are checked before the dynamic :whiteLabel pattern in routing.
 *
 * Using component references (not JSX instances) to avoid instantiating
 * components at module load time, which can cause issues with context that
 * isn't yet available.
 */
interface LandingPageConfig {
  path: string;
  whiteLabel: string; // The white label this landing page belongs to
  component: ComponentType<any>;
  props?: Record<string, any>;
}

export const CUSTOM_LANDING_PAGES: LandingPageConfig[] = [
  {
    path: 'co/jeffcohs',
    whiteLabel: 'co',
    component: JeffcoLandingPage,
    props: { referrer: 'jeffcoHS' },
  },
  {
    path: 'co/jeffcohscm',
    whiteLabel: 'co',
    component: JeffcoLandingPage,
    props: { referrer: 'jeffcoHSCM' },
  },
  {
    path: 'co/ccig',
    whiteLabel: 'co',
    component: CcigLandingPage,
  },
  {
    path: 'co_energy_calculator/landing-page',
    whiteLabel: 'co_energy_calculator',
    component: EnergyCalculatorLandingPage,
  },
];
