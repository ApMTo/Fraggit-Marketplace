export function formatLotPrice(
  price: string | number,
  locale: string,
  currency = 'AMD',
): string {
  const value = typeof price === 'number' ? price : Number(price);

  if (!Number.isFinite(value)) {
    return String(price);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
