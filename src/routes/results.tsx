import { Navigate, RouteObject } from 'react-router-dom';
import Results from '../Components/Results/Results';
import ConnectNowPage from '../Components/EnergyCalculator/Results/HeatPumpJourney/ConnectNowPage';
import CalculateImpactPage from '../Components/EnergyCalculator/Results/HeatPumpJourney/CalculateImpactPage';

/**
 * Results page routes - terminal routes displaying calculation results.
 */
const resultsRoutes: RouteObject[] = [
  { path: 'results', element: <Navigate to="benefits" replace /> },
  { path: 'results/benefits', element: <Results type="program" /> },
  { path: 'results/near-term-needs', element: <Results type="need" /> },
  {
    path: 'results/energy-rebates/waterHeater/connect-now',
    element: <ConnectNowPage />,
  },
  {
    path: 'results/energy-rebates/waterHeater/calculate-impact',
    element: <CalculateImpactPage />,
  },
  {
    path: 'results/energy-rebates/:energyCalculatorRebateType',
    element: <Results type="energy-calculator-rebates" />,
  },
  { path: 'results/benefits/:programId', element: <Results type="program" /> },
  { path: 'results/more-help', element: <Results type="help" /> },
];

export default resultsRoutes;
