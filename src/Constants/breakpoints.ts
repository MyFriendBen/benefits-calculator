/**
 * Standard breakpoints for responsive design
 * Use these constants consistently across the application
 */
export const BREAKPOINTS = {
  /** Mobile devices - up to 480px */
  mobile: 480,
  /** Tablet devices - 481px to 774px */
  tablet: 775,
  /** Desktop devices - 775px and above */
  desktop: 1200,
} as const;

/**
 * Helper function to check if current window width is mobile
 * @param width - Current window width in pixels
 * @returns true if width is less than or equal to mobile breakpoint
 */
export const isMobileWidth = (width: number): boolean => width < BREAKPOINTS.tablet;

/**
 * Helper function to check if current window width is tablet
 * @param width - Current window width in pixels
 * @returns true if width is between mobile and desktop breakpoints
 */
export const isTabletWidth = (width: number): boolean =>
  width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;

/**
 * Helper function to check if current window width is desktop
 * @param width - Current window width in pixels
 * @returns true if width is greater than or equal to desktop breakpoint
 */
export const isDesktopWidth = (width: number): boolean => width >= BREAKPOINTS.desktop;
