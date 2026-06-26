import { CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { BrandedFooter, BrandedHeader } from '../Referrer/Referrer';
import FaviconManager from '../FaviconManager/FaviconManager';
import SystemBanner, { BannerMessage } from '../Common/SystemBanner/SystemBanner';
import ProgressBarManager from '../RouterUtil/ProgressBarManager';
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
  const bannerMessages = config?.banner_messages as BannerMessage[] | undefined;

  return (
    <div className="app">
      <CssBaseline />
      <FaviconManager />
      <BrandedHeader />
      <Box className="main-max-width">
        {bannerMessages && bannerMessages.length > 0 && (
          <SystemBanner banners={bannerMessages} />
        )}
        <ProgressBarManager totalSteps={totalSteps} />
        {children}
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <BrandedFooter />
    </div>
  );
};

export default AppLayout;
