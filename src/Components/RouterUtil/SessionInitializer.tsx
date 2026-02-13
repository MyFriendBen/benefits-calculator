import { useEffect, useContext } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import { ALL_VALID_WHITE_LABELS, WhiteLabel } from '../../Types/WhiteLabel';

interface SessionInitializerProps {
  whiteLabel?: string; // Optional: if provided, use this instead of URL params
}

/**
 * Initializes the session by setting the white label and triggering config load.
 * Just sets the white label and renders children - App component handles waiting for config.
 *
 * Can get white label from:
 * 1. Props (for custom landing pages)
 * 2. URL params (for dynamic routes like /:whiteLabel/current-benefits)
 */
const SessionInitializer = ({ whiteLabel: whiteLabelProp }: SessionInitializerProps = {}) => {
  const { setWhiteLabel, setScreenLoading } = useContext(Context);
  const { whiteLabel: whiteLabelParam } = useParams();

  // Use prop if provided, otherwise use URL param
  const whiteLabel = whiteLabelProp ?? whiteLabelParam;

  useEffect(() => {
    // Only set white label if it's valid, otherwise ValidateWhiteLabel will handle redirect
    if (whiteLabel !== undefined && ALL_VALID_WHITE_LABELS.includes(whiteLabel as WhiteLabel)) {
      setWhiteLabel(whiteLabel);
    }
    // Trigger config loading
    setScreenLoading(false);
  }, [whiteLabel, setWhiteLabel, setScreenLoading]);

  return <Outlet />;
};

export default SessionInitializer;
