/**
 * Product URLs follow Fourthwall's own storefront pattern:
 *   /USD/product/launch-t-shirt?color=Terracotta&size=M
 * (the handle is Fourthwall's product slug).
 */

export const DEFAULT_CURRENCY = 'USD';

/** Currencies Fourthwall's Storefront API accepts. */
export const FOURTHWALL_CURRENCIES = [
  'USD', 'EUR', 'CAD', 'GBP', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK',
  'PLN', 'INR', 'JPY', 'MYR', 'SGD', 'MXN', 'BRL', 'CHF',
] as const;

/**
 * Prices, cart and checkout all run in this currency today. A product URL
 * with another valid currency redirects here so a shopper can never see one
 * currency on the page and pay in another.
 */
export const SUPPORTED_STORE_CURRENCIES: readonly string[] = [DEFAULT_CURRENCY];

export function isKnownCurrency(value: string): boolean {
  return (FOURTHWALL_CURRENCIES as readonly string[]).includes(value.toUpperCase());
}

export function productPath(slug: string, currency: string = DEFAULT_CURRENCY): string {
  return `/${currency.toUpperCase()}/product/${encodeURIComponent(slug)}`;
}
