/**
 * Standard breakpoints for responsive design
 * Use these constants consistently across the application
 */
export const BREAKPOINTS = {
  /** Mobile/Desktop threshold - 767px and below is mobile, 768px+ is desktop */
  desktop: 768,
} as const;

/**
 * Helper function to check if current window width is mobile
 * @param width - Current window width in pixels
 * @returns true if width is less than desktop breakpoint (0-767px)
 */
export const isMobileWidth = (width: number): boolean => width < BREAKPOINTS.desktop;

/**
 * Helper function to check if current window width is desktop
 * @param width - Current window width in pixels
 * @returns true if width is greater than or equal to desktop breakpoint (768px+)
 */
export const isDesktopWidth = (width: number): boolean => width >= BREAKPOINTS.desktop;
