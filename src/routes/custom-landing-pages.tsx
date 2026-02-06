import { ReactElement } from 'react';
import JeffcoLandingPage from '../Components/JeffcoComponents/JeffcoLandingPage/JeffcoLandingPage';
import CcigLandingPage from '../Components/CcigComponents/CcigLandingPage';
import EnergyCalculatorLandingPage from '../Components/EnergyCalculator/LandingPage/LandingPage';

/**
 * Custom landing pages for partner integrations.
 * These are hardcoded routes that bypass the generic white label system.
 * They're checked before the dynamic :whiteLabel pattern.
 */
export const CUSTOM_LANDING_PAGES: Array<{ path: string; element: ReactElement }> = [
  {
    path: 'co/jeffcohs',
    element: <JeffcoLandingPage referrer="jeffcoHS" />,
  },
  {
    path: 'co/jeffcohscm',
    element: <JeffcoLandingPage referrer="jeffcoHSCM" />,
  },
  {
    path: 'co/ccig',
    element: <CcigLandingPage />,
  },
  {
    path: 'co_energy_calculator/landing-page',
    element: <EnergyCalculatorLandingPage />,
  },
];
