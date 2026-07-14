import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { useResultsContext } from './Results';

export default function NoProgramEligibleMessage() {
  const { getReferrer } = useContext(Context);
  const { programs, energyCalculatorRebateCategories } = useResultsContext();
  const noResultsMessage = getReferrer('noResultMessage');

  const noProgramsEligible = programs.length === 0 && energyCalculatorRebateCategories.length === 0;

  // Note: the screener_results_none_eligible analytics event is fired in
  // Results.tsx from the UNFILTERED result set (so a filter hiding all programs
  // isn't miscounted as "none eligible"). This component only handles display.

  if (!noProgramsEligible) {
    return null;
  }
  return <div className="back-to-screen-message">{noResultsMessage}</div>;
}
