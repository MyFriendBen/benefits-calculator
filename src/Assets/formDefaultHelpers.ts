/**
 * Determines default form items (e.g., income streams) based on context.
 * Returns existing items if available, or adds a default empty item
 * for eligible members on their first visit.
 *
 * @param existingItems - Current items from form data (may be undefined)
 * @param hasProgressed - Whether user has already progressed through the form
 * @param isEligible - Whether member is eligible for default item (e.g., working age)
 * @param emptyTemplate - Default empty item template to use
 */
export function getDefaultFormItems<T>(
  existingItems: T[] | undefined,
  hasProgressed: boolean,
  isEligible: boolean,
  emptyTemplate: T,
): T[] {
  // If there are existing items, return them
  if (existingItems && existingItems.length > 0) {
    return existingItems;
  }

  // If user has already been through form, respect their empty selection
  if (hasProgressed) {
    return [];
  }

  // For eligible members on first visit, auto-add one empty item
  if (isEligible) {
    return [emptyTemplate];
  }

  return [];
}
