/**
 * Converts a camelCase string to Title Case with spaces.
 * Used as a fallback label when a translation key is missing.
 * e.g. "childCare" → "Child Care", "rentMortgage" → "Rent Mortgage"
 */
export function camelCaseToTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase());
}
