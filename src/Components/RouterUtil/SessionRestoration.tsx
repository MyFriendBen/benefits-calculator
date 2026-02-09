import { useEffect, useContext, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import LoadingPage from '../LoadingPage/LoadingPage';
import useScreenApi from '../../Assets/updateScreen';
import { isValidUuid } from './ValidateUuid';
import { ScreenApiResponse } from '../../apiCalls';
import SessionInitializer from './SessionInitializer';
import { ALL_VALID_WHITE_LABELS, WhiteLabel } from '../../Types/WhiteLabel';

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
    // Check if whiteLabel param is actually a UUID (for /:uuid routes)
    // This must be checked FIRST before checking if rawUuid is undefined
    if (rawWhiteLabel !== undefined && isValidUuid(rawWhiteLabel ?? '')) {
      return { uuid: rawWhiteLabel, whiteLabel: undefined };
    }

    // If rawUuid is undefined, we have no valid UUID
    if (rawUuid === undefined) {
      return { uuid: undefined, whiteLabel: rawWhiteLabel };
    }

    // Validate rawUuid
    if (!isValidUuid(rawUuid)) {
      return { uuid: undefined, whiteLabel: rawWhiteLabel };
    }

    return { uuid: rawUuid, whiteLabel: rawWhiteLabel };
  }, [rawUuid, rawWhiteLabel]);

  const restoreSession = async () => {
    try {
      // Pass the disambiguated UUID to fetchScreen
      const response = await fetchScreen(uuid);
      if (response) {
        handleSessionResponse(response);
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
      // Preserve white label context, query params, and hash in error redirect
      const errorRedirect = whiteLabel ? `/${whiteLabel}/step-1` : '/step-1';
      navigate(`${errorRedirect}${location.search}${location.hash}`);
      return;
    } finally {
      setScreenLoading(false);
    }
  };

  const handleSessionResponse = (response: ScreenApiResponse) => {
    // Validate white label from API response before setting
    if (ALL_VALID_WHITE_LABELS.includes(response.white_label as WhiteLabel)) {
      setWhiteLabel(response.white_label);

      // Redirect to URL with correct white label if needed
      if (whiteLabel === undefined) {
        navigate(`/${response.white_label}${location.pathname}${location.search}${location.hash}`);
      } else if (whiteLabel !== response.white_label) {
        // Replace only the first path segment (white label)
        const pathSegments = location.pathname.split('/').filter(Boolean);
        pathSegments[0] = response.white_label;
        navigate(`/${pathSegments.join('/')}${location.search}${location.hash}`);
      }
    } else {
      // Invalid white label from API, redirect to step-1 with context preservation
      console.error(`Invalid white label from API: ${response.white_label}`);
      const errorRedirect = whiteLabel ? `/${whiteLabel}/step-1` : '/step-1';
      navigate(`${errorRedirect}${location.search}${location.hash}`);
    }
  };

  useEffect(() => {
    // Valid UUID, restore session from API
    if (uuid !== undefined) {
      restoreSession();
    }
  }, [uuid, whiteLabel]);

  // If no valid UUID, just initialize the session without API call
  if (uuid === undefined) {
    return <SessionInitializer />;
  }

  return <LoadingPage />;
};

export default SessionRestoration;
