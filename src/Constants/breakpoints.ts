/**
 * Standard breakpoints for responsive design
 * Use these constants consistently across the application
 */
export const BREAKPOINTS = {
  /** Mobile devices - up to 480px */
  mobile: 480,
  /** Tablet/Desktop threshold - 775px */
  tablet: 775,
} as const;

/**
 * Helper function to check if current window width is mobile
 * @param width - Current window width in pixels
 * @returns true if width is less than or equal to mobile breakpoint (480px)
 */
export const isMobileWidth = (width: number): boolean => width <= BREAKPOINTS.mobile;

/**
 * Helper function to check if current window width is tablet
 * @param width - Current window width in pixels
 * @returns true if width is between mobile and tablet breakpoints (481-774px)
 */
export const isTabletWidth = (width: number): boolean =>
  width > BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;

/**
 * Helper function to check if current window width is desktop
 * @param width - Current window width in pixels
 * @returns true if width is greater than or equal to tablet breakpoint (775px+)
 */
export const isDesktopWidth = (width: number): boolean => width >= BREAKPOINTS.tablet;
