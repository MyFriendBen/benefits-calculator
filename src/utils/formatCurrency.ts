export function formatToUSD(num: number, significantFigures: number = Number.isInteger(num) ? 0 : 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: significantFigures,
    maximumFractionDigits: significantFigures,
  }).format(num);
}
