import { useContext, useEffect, useRef } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { useResultsContext } from './Results';
import { useTrackEvent } from '../../Assets/analytics';

export default function NoProgramEligibleMessage() {
  const { getReferrer } = useContext(Context);
  const { programs, energyCalculatorRebateCategories } = useResultsContext();
  const noResultsMessage = getReferrer('noResultMessage');
  const track = useTrackEvent();

  const noProgramsEligible = programs.length === 0 && energyCalculatorRebateCategories.length === 0;

  // Fire once per page view. `programs` is filtered data, so toggling filters
  // can flip noProgramsEligible true again — the ref guard prevents re-firing,
  // matching Results.tsx's hasTrackedResultsLoaded.
  const hasTrackedNoneEligible = useRef(false);
  useEffect(() => {
    if (noProgramsEligible && !hasTrackedNoneEligible.current) {
      hasTrackedNoneEligible.current = true;
      track('screener_results_none_eligible', {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noProgramsEligible]);

  if (!noProgramsEligible) {
    return null;
  }
  return <div className="back-to-screen-message">{noResultsMessage}</div>;
}
