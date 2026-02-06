import { useEffect, useContext, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import LoadingPage from '../LoadingPage/LoadingPage';
import useScreenApi from '../../Assets/updateScreen';
import { isValidUuid } from './ValidateUuid';
import { ScreenApiResponse } from '../../apiCalls';
import SessionInitializer from './SessionInitializer';

/**
 * Restores a session from a UUID by fetching data from the API.
 * Handles UUID validation, API calls, white label setting, and navigation.
 *
 * Used for routes with UUID in URL: /:uuid or /:whiteLabel/:uuid
 *
 * UUID Parsing Logic:
 * - If rawWhiteLabel is actually a UUID, treat it as the UUID (handles /:uuid paths)
 * - Otherwise, use rawUuid as the UUID (handles /:whiteLabel/:uuid paths)
 */
const SessionRestoration = () => {
  const { setScreenLoading, setWhiteLabel } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();
  const { uuid: rawUuid, whiteLabel: rawWhiteLabel } = useParams();
  const { fetchScreen } = useScreenApi();

  // Parse UUID and white label from params (handles both /:uuid and /:whiteLabel/:uuid)
  const { uuid, whiteLabel } = useMemo(() => {
    if (rawUuid === undefined) {
      return { uuid: undefined, whiteLabel: rawWhiteLabel };
    }

    // Check if whiteLabel param is actually a UUID (for /:uuid routes)
    if (rawWhiteLabel !== undefined && isValidUuid(rawWhiteLabel ?? '')) {
      return { uuid: rawWhiteLabel, whiteLabel: undefined };
    } else if (!isValidUuid(rawUuid)) {
      return { uuid: undefined, whiteLabel: rawWhiteLabel };
    }

    return { uuid: rawUuid, whiteLabel: rawWhiteLabel };
  }, [rawUuid, rawWhiteLabel]);

  const restoreSession = async () => {
    try {
      const response = await fetchScreen();
      if (response) {
        handleSessionResponse(response);
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
      navigate('/step-1');
      return;
    }
    setScreenLoading(false);
  };

  const handleSessionResponse = (response: ScreenApiResponse) => {
    setWhiteLabel(response.white_label);

    // Redirect to URL with correct white label if needed
    if (whiteLabel === undefined) {
      navigate(`/${response.white_label}${location.pathname}`);
    } else if (whiteLabel !== response.white_label) {
      navigate(location.pathname.replace(whiteLabel, response.white_label));
    }
  };

  // If no valid UUID, just initialize the session without API call
  if (uuid === undefined) {
    return <SessionInitializer />;
  }

  useEffect(() => {
    // Valid UUID, restore session from API
    restoreSession();
  }, [uuid, whiteLabel]);

  return <LoadingPage />;
};

export default SessionRestoration;
