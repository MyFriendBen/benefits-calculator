import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { useContext, useMemo } from 'react';
import { useLocation, Navigate, Routes, Route } from 'react-router-dom';
import { LicenseInfo } from '@mui/x-license-pro';
import { Context } from './Components/Wrapper/Wrapper';
import LoadingRoutes from './Components/RouterUtil/LoadingRoutes';
import AppLayout from './Components/AppLayout/AppLayout';
import QuestionComponentContainer from './Components/QuestionComponentContainer/QuestionComponentContainer';
import Confirmation from './Components/Confirmation/Confirmation';
import Results from './Components/Results/Results';
import Disclaimer from './Components/Steps/Disclaimer/Disclaimer';
import JeffcoLandingPage from './Components/JeffcoComponents/JeffcoLandingPage/JeffcoLandingPage';
import SelectLanguagePage from './Components/Steps/SelectLanguage';
import { useStepNumber } from './Assets/stepDirectory';
import CcigLandingPage from './Components/CcigComponents/CcigLandingPage';
import languageRouteWrapper from './Components/RouterUtil/LanguageRouter';
import SelectStatePage from './Components/Steps/SelectStatePage';
import CurrentBenefits from './Components/CurrentBenefits/CurrentBenefits';
import EcHouseholdMemberForm from './Components/EnergyCalculator/Steps/HouseholdMemberForm';
import HouseholdMemberForm from './Components/Steps/HouseholdMembers/HouseholdMemberForm';
import EnergyCalculatorLandingPage from './Components/EnergyCalculator/LandingPage/LandingPage';
import WhiteLabelRouter from './Components/RouterUtil/WhiteLabelRouter';
import ValidateUuid from './Components/RouterUtil/ValidateUuid';
import ValidateWhiteLabel from './Components/RouterUtil/ValidateWhiteLabel';
import './App.css';
import useCampaign from './Components/CampaignAnalytics/useCampaign';
import { useAppInitialization } from './hooks';

// Initialize MUI X License
LicenseInfo.setLicenseKey(process.env.REACT_APP_MUI_LICENSE_KEY + '=');

const App = () => {
  const location = useLocation();
  const urlSearchParams = location.search;
  const { styleOverride, pageIsLoading, getReferrer } = useContext(Context);
  const theme = useMemo(() => createTheme(styleOverride), [styleOverride]);
  const themeName = getReferrer('theme', 'default');
  const householdMemberStepNumber = useStepNumber('householdData', false);
  const ecHouseholdMemberStepNumber = useStepNumber('energyCalculatorHouseholdData', false);

  // Initialize all app-level side effects
  useAppInitialization(themeName);
  useCampaign();

  if (pageIsLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingRoutes />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppLayout showLayout={true}>
        <Routes>
            {languageRouteWrapper(
              <>
                <Route path="" element={<Navigate to={`/step-1${urlSearchParams}`} replace />} />
                <Route path="co/jeffcohs" element={<JeffcoLandingPage referrer="jeffcoHS" />} />
                <Route path="co/jeffcohscm" element={<JeffcoLandingPage referrer="jeffcoHSCM" />} />
                <Route path="co/ccig" element={<CcigLandingPage />} />
                <Route path="co_energy_calculator/landing-page" element={<EnergyCalculatorLandingPage />} />
                <Route path="step-1" element={<SelectLanguagePage />} />
                <Route path="select-state" element={<SelectStatePage />} />
                <Route path=":whiteLabel" element={<ValidateWhiteLabel />}>
                  <Route index element={<WhiteLabelRouter />} />
                  <Route path="current-benefits" element={<CurrentBenefits />} />
                  <Route path="select-state" element={<SelectStatePage />} />
                  <Route path="step-1" element={<SelectLanguagePage />} />
                  <Route path="step-2" element={<Disclaimer />} />
                  <Route path=":uuid" element={<ValidateUuid />}>
                    <Route path="" element={<Navigate to="/step-1" replace />} />
                    <Route path="step-1" element={<SelectLanguagePage />} />
                    <Route path="step-2" element={<Disclaimer />} />
                    <Route path={`step-${householdMemberStepNumber}/:page`} element={<HouseholdMemberForm key={window.location.href} />} />
                    <Route path={`step-${ecHouseholdMemberStepNumber}/:page`} element={<EcHouseholdMemberForm key={window.location.href} />} />
                    <Route path="step-:id" element={<QuestionComponentContainer key={window.location.href} />} />
                    <Route path="confirm-information" element={<Confirmation />} />
                    <Route path="results/benefits" element={<Results type="program" />} />
                    <Route path="results/near-term-needs" element={<Results type="need" />} />
                    <Route path="results/energy-rebates/:energyCalculatorRebateType" element={<Results type="energy-calculator-rebates" />} />
                    <Route path="results/benefits/:programId" element={<Results type="program" />} />
                    <Route path="results/more-help" element={<Results type="help" />} />
                    <Route path="results" element={<Navigate to="benefits" replace />} />
                    <Route path="*" element={<Navigate to="/step-1" replace />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to={`/step-1${urlSearchParams}`} replace />} />
              </>,
            )}
          </Routes>
      </AppLayout>
    </ThemeProvider>
  );
};

export default App;
