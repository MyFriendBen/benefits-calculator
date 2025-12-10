/**
 * Shared utility for determining default form field arrays
 * Used by both income and expense forms to handle "smart defaults"
 */

/**
 * Generic helper to determine default items for array-based form fields
 *
 * Logic:
 * - If existing items exist, return them
 * - If it's the first visit (based on progression check), show empty item(s) if condition is met
 * - If user has progressed past and deleted all items, respect that (empty array)
 *
 * @param existingItems - Current items from form data
 * @param hasProgressed - Whether user has progressed past this section
 * @param shouldShowOnFirstVisit - Condition to determine if empty item should be shown on first visit
 * @param emptyItem - The empty item to add on first visit
 * @returns Array of items to use as defaults
 */
export const getDefaultFormItems = <T>(
  existingItems: T[] | undefined,
  hasProgressed: boolean,
  shouldShowOnFirstVisit: boolean,
  emptyItem: T
): T[] => {
  const existing = existingItems ?? [];

  // If they have items, use them
  if (existing.length > 0) {
    return existing;
  }

  // If it's first visit and condition is met, show one empty item
  const isFirstVisit = !hasProgressed && existing.length === 0;
  if (isFirstVisit && shouldShowOnFirstVisit) {
    return [emptyItem];
  }

  // They've been here before and deleted everything - respect that
  return [];
};
