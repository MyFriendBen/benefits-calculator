import { Routes, Route } from 'react-router-dom';
import ProgressBar from '../ProgressBar/ProgressBar';

/**
 * Progress bar routes that render alongside main content routes.
 * Shows progress indicator based on current route.
 */
interface ProgressBarRoutesProps {
  totalSteps: number;
}

const ProgressBarRoutes = ({ totalSteps }: ProgressBarRoutesProps) => {
  return (
    <Routes>
      <Route path="step-1" element={<ProgressBar step={1} />} />
      <Route path=":whiteLabel/step-1" element={<ProgressBar step={1} />} />
      <Route path="select-state" element={<ProgressBar step={1} />} />
      <Route path=":whiteLabel/select-state" element={<ProgressBar step={1} />} />
      <Route path=":whiteLabel/step-2" element={<ProgressBar step={2} />} />
      <Route path=":whiteLabel/:uuid/step-:id" element={<ProgressBar />} />
      <Route path=":whiteLabel/:uuid/step-:id/:page" element={<ProgressBar />} />
      <Route path=":whiteLabel/:uuid/confirm-information" element={<ProgressBar step={totalSteps} />} />
      <Route path="*" element={<></>} />
    </Routes>
  );
};

export default ProgressBarRoutes;
