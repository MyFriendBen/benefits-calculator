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

  // Determine step number based on page type
  let step: number | undefined;

  if (location.pathname.includes('confirm-information')) {
    // Confirmation page is the final step
    step = totalSteps;
  } else if (location.pathname.includes('select-state')) {
    // Select state is a pre-questionnaire page (step 0 equivalent, but show as step 1 for UX)
    step = 1;
  }
  // Otherwise, let ProgressBar derive step from URL params/pathname

  return <ProgressBar step={step} />;
};

export default ProgressBarManager;
