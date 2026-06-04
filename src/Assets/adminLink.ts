/**
 * Append the `admin=true` query param to an internal link when in admin view.
 *
 * Shared by the results pages and the energy-calculator heat pump journey pages
 * (Results, CalculateImpactPage, ConnectNowPage) so the admin passthrough stays
 * consistent in one place.
 */
export function addAdminToLink(link: string, isAdmin: boolean): string {
  if (isAdmin) {
    return `${link}?admin=true`;
  }
  return link;
}
