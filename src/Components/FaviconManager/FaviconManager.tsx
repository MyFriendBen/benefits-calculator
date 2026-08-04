import { useEffect, useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';

const FaviconManager = () => {
  const context = useContext(Context);

  useEffect(() => {
    // Exit early if context is not available or config is still loading
    if (!context || !context.getReferrer || context.configLoading) {
      return;
    }

    const white_label = context.whiteLabel || 'default';

    const updateFavicon = () => {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach((link) => link.remove());

      // Get favicon path from referrer config
      let faviconPath = 'favicon.ico'; // default

      try {
        // getReferrer resolves the referrer-specific value (or its default) and returns a string
        const faviconSource = context.getReferrer('faviconSource');
        if (faviconSource) {
          faviconPath = faviconSource;
        }
      } catch (error) {
        // If getReferrer fails, use default favicon
        console.warn('Failed to get favicon source from config:', error);
      }

      // Create new favicon links with cache busting
      const timestamp = new Date().getTime();
      // Ensure path starts with /
      const normalizedPath = faviconPath.startsWith('/') ? faviconPath : `/${faviconPath}`;
      const cacheBustedPath = `${normalizedPath}?v=${white_label}_${timestamp}`;

      // Add multiple favicon formats for better browser support
      const link16 = document.createElement('link');
      link16.rel = 'icon';
      link16.type = 'image/png';
      link16.setAttribute('sizes', '16x16');
      link16.href = cacheBustedPath;

      const link32 = document.createElement('link');
      link32.rel = 'icon';
      link32.type = 'image/png';
      link32.setAttribute('sizes', '32x32');
      link32.href = cacheBustedPath;

      // Add shortcut icon for older browsers
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.href = cacheBustedPath;

      document.head.appendChild(link16);
      document.head.appendChild(link32);
      document.head.appendChild(shortcutIcon);

      // Favicon updated for white label logging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`Favicon updated for white label: ${white_label}, path: ${faviconPath}`);
      }
    };

    updateFavicon();
  }, [context, context.whiteLabel, context.configLoading]);

  return null;
};

export default FaviconManager;
