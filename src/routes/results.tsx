import { Route, Navigate } from 'react-router-dom';
import Results from '../components/Results/Results';

/**
 * Results page routes - terminal routes displaying calculation results.
 */
const ResultsRoutes = () => {
  return (
    <>
      <Route path="results/benefits" element={<Results type="program" />} />
      <Route path="results/near-term-needs" element={<Results type="need" />} />
      <Route
        path="results/energy-rebates/:energyCalculatorRebateType"
        element={<Results type="energy-calculator-rebates" />}
      />
      <Route path="results/benefits/:programId" element={<Results type="program" />} />
      <Route path="results/more-help" element={<Results type="help" />} />
      <Route path="results" element={<Navigate to="benefits" replace />} />
    </>
  );
};

export default ResultsRoutes;
