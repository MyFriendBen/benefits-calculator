/**
 * Standard breakpoints for responsive design
 * Use these constants consistently across the application with Material-UI's useMediaQuery hook
 *
 * Example usage:
 * ```tsx
 * import { useMediaQuery } from '@mui/material';
 * import { BREAKPOINTS } from './utils/breakpoints';
 *
 * // Mobile is below desktop breakpoint (0-767px)
 * const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.desktop - 1}px)`);
 * ```
 */
export const BREAKPOINTS = {
  /** Mobile/Desktop threshold - 767px and below is mobile, 768px+ is desktop */
  desktop: 768,
} as const;
