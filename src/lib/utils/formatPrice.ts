export function formatPrice(cents: number, currency: string = 'USD'): string {
  if (cents === 0) {
    return 'Free';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * "$31.00 USD" / "€28.26 EUR" — symbol plus the currency code, so a shopper
 * can always tell dollars from Canadian dollars. Never returns "Free".
 */
export function formatPriceWithCode(cents: number, currency: string = 'USD'): string {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(cents / 100);
  return `${amount} ${currency}`;
}
