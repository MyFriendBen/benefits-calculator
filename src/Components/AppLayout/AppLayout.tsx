import { CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { BrandedFooter, BrandedHeader } from '../Referrer/Referrer';
import FaviconManager from '../FaviconManager/FaviconManager';
import SystemBanner, { BannerMessage } from '../Common/SystemBanner/SystemBanner';
import ProgressBarRoutes from '../RouterUtil/ProgressBarRoutes';
import { STARTING_QUESTION_NUMBER, useStepDirectory } from '../../Assets/stepDirectory';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Main application layout component.
 * Renders the header, footer, banner, progress bar, and main content area.
 */
const AppLayout = ({ children }: AppLayoutProps) => {
  const { config } = useContext(Context);
  const stepDirectory = useStepDirectory();
  const totalSteps = stepDirectory ? stepDirectory.length + STARTING_QUESTION_NUMBER : STARTING_QUESTION_NUMBER;

  return (
    <div className="app">
      <CssBaseline />
      <FaviconManager />
      <BrandedHeader />
      <Box className="main-max-width">
        {config?.banner_messages && (config.banner_messages as BannerMessage[]).length > 0 && (
          <SystemBanner banners={config.banner_messages as BannerMessage[]} />
        )}
        <ProgressBarRoutes totalSteps={totalSteps} />
        {children}
      </Box>
      <BrandedFooter />
    </div>
  );
};

export default AppLayout;
