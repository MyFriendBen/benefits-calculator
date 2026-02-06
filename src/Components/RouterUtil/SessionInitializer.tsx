import { useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Context } from '../Wrapper/Wrapper';
import LoadingPage from '../LoadingPage/LoadingPage';

/**
 * Initializes the session by setting the white label from URL params.
 * Does NOT fetch data from API - just sets context and turns off loading state.
 *
 * Used for routes that have white label in URL but no UUID.
 * Example routes: /:whiteLabel/current-benefits
 */
const SessionInitializer = () => {
  const { setScreenLoading, setWhiteLabel } = useContext(Context);
  const { whiteLabel } = useParams();

  useEffect(() => {
    if (whiteLabel !== undefined) {
      setWhiteLabel(whiteLabel);
    }
    setScreenLoading(false);
  }, [whiteLabel, setWhiteLabel, setScreenLoading]);

  return <LoadingPage />;
};

export default SessionInitializer;
