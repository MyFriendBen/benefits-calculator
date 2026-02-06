import { useLocation } from 'react-router-dom';
import ProgressBar from '../ProgressBar/ProgressBar';

/**
 * Manages when and how to display the progress bar based on current route.
 */
interface ProgressBarManagerProps {
  totalSteps: number;
}

const ProgressBarManager = ({ totalSteps }: ProgressBarManagerProps) => {
  const location = useLocation();

  // Only show progress bar on step-related pages
  if (!location.pathname.match(/(step-|select-state|confirm-information)/)) {
    return null;
  }

  // Override step for confirmation page, otherwise let ProgressBar derive from URL params
  const step = location.pathname.includes('confirm-information') ? totalSteps : undefined;

  return <ProgressBar step={step} />;
};

export default ProgressBarManager;
