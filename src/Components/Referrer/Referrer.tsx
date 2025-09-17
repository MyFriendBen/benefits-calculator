import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import Header from '../Header/Header';
import TwoOneOneFooterCO from '../TwoOneOneCOComponents/TwoOneOneFooterCO/TwoOneOneFooterCO';
import TwoOneOneHeaderCO from '../TwoOneOneCOComponents/TwoOneOneHeaderCO/TwoOneOneHeaderCO';
import Footer from '../Footer/Footer';
import BackToScreen from '../BackToScreen/BackToScreen';
import { useResultsContext } from '../Results/Results';
import NoProgramEligibleMessage from '../Results/NoProgramEligibleMessage';
import NcLink211Message from '../Results/NcLink211Message';
import CcigResultsMessage from '../CcigComponents/CcigResultsMessage';
import TwoOneOneHeaderNC from '../TwoOneOneNCComponents/TwoOneOneHeaderNC/TwoOneOneHeaderNC';
import TwoOneOneFooterNC from '../TwoOneOneNCComponents/TwoOneOneFooterNC/TwoOneOneFooterNC';
import PoweredByFooter from '../Footer/PoweredByFooter';
import EnergyCalculatorFooter from '../EnergyCalculator/Footer/Footer';
import LancHeader from '../LancComponents/LancHeader/LancHeader';
import LancFooter from '../LancComponents/LancFooter/LancFooter';
import NCHispanicFederationFooter from '../NCHispanicFederation/NCHispanicFederationFooter/NCHispanicFederationFooter';

export const BrandedHeader = () => {
  const { getReferrer } = useContext(Context);
  const featureFlags = getReferrer('featureFlags');

  if (featureFlags.includes('211co')) {
    return <TwoOneOneHeaderCO />;
  }

  if (featureFlags.includes('211nc')) {
    return <TwoOneOneHeaderNC />;
  }

  if (featureFlags.includes('lanc')) {
    return <LancHeader />;
  }

  return <Header />;
};

export const BrandedFooter = () => {
  const { getReferrer } = useContext(Context);
  const featureFlags = getReferrer('featureFlags');

  const footerMap = [
    { flag: '211co', component: TwoOneOneFooterCO },
    { flag: '211nc', component: TwoOneOneFooterNC },
    { flag: 'lanc', component: LancFooter },
    { flag: 'hfed', component: NCHispanicFederationFooter },
    { flag: 'energy_calculator', component: EnergyCalculatorFooter },
    { flag: 'powered_by_mfb_footer', component: PoweredByFooter },
  ];

  for (const { flag, component: Component } of footerMap) {
    if (featureFlags.includes(flag)) {
      return <Component />;
    }
  }

  return <Footer />;
};

export const ResultsMessageForNeeds = () => {
  const { getReferrer } = useContext(Context);
  const featureFlags = getReferrer('featureFlags');

  if (featureFlags.includes('nc_show_211_link')) {
    return <NcLink211Message />;
  }
  return null;
};

export const ResultsMessage = () => {
  const { formData } = useContext(Context);
  const { missingPrograms } = useResultsContext();

  if (formData.immutableReferrer === 'lgs' && missingPrograms) {
    return <BackToScreen />;
  }
  if (formData.immutableReferrer === 'ccig') {
    return <CcigResultsMessage />;
  }

  return <NoProgramEligibleMessage />;
};
