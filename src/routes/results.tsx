import { Navigate, RouteObject } from 'react-router-dom';
import Results from '../Components/Results/Results';

/**
 * Results page routes - terminal routes displaying calculation results.
 */
const resultsRoutes: RouteObject[] = [
  { path: 'results/benefits', element: <Results type="program" /> },
  { path: 'results/near-term-needs', element: <Results type="need" /> },
  {
    path: 'results/energy-rebates/:energyCalculatorRebateType',
    element: <Results type="energy-calculator-rebates" />,
  },
  { path: 'results/benefits/:programId', element: <Results type="program" /> },
  { path: 'results/more-help', element: <Results type="help" /> },
  { path: 'results', element: <Navigate to="benefits" replace /> },
];

export default resultsRoutes;
