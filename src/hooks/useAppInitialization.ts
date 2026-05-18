import { useThemeValidation } from './useThemeValidation';
import { usePageTracking } from './usePageTracking';
import { useHttpsRedirect } from './useHttpsRedirect';
import { useUrlParametersInit } from './useUrlParametersInit';
import { useScrollToTop } from './useScrollToTop';

/**
 * Orchestrates all app initialization hooks.
 * Sets up theme validation, analytics tracking, HTTPS redirect,
 * URL parameter initialization, scroll behavior, and page title.
 */
export const useAppInitialization = (themeName: string) => {
  useThemeValidation(themeName);
  usePageTracking();
  useHttpsRedirect();
  useUrlParametersInit();
  useScrollToTop();
};
