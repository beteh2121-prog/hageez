export function formatPrice(cents: number, currency: string = 'USD'): string {
  if (cents === 0) {
    return 'Free';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
