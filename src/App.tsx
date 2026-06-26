import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { useContext, useMemo } from 'react';
import { LicenseInfo } from '@mui/x-license-pro';
import { Context } from './Components/Wrapper/Wrapper';
import InitializationRouter from './Components/RouterUtil/InitializationRouter';
import AppLayout from './Components/AppLayout/AppLayout';
import AppRoutes from './routes';
import useCampaign from './Components/CampaignAnalytics/useCampaign';
import { useAppInitialization } from './hooks';
import './App.css';

// Initialize MUI X License
LicenseInfo.setLicenseKey(process.env.REACT_APP_MUI_LICENSE_KEY + '=');

const App = () => {
  const { styleOverride, pageIsLoading, getReferrer } = useContext(Context);
  const theme = useMemo(() => createTheme(styleOverride), [styleOverride]);
  const themeName = getReferrer('theme', 'default');

  // Initialize all app-level side effects
  useAppInitialization(themeName);
  useCampaign();

  if (pageIsLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <InitializationRouter />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </ThemeProvider>
  );
};

export default App;
