// Builds the tel: link from the number the footer displays, so the two can't disagree.
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`;
}
