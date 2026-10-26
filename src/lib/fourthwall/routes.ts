/**
 * Product URLs follow Fourthwall's own storefront pattern:
 *   /USD/product/launch-t-shirt?color=Terracotta&size=M
 * (the handle is Fourthwall's product slug).
 */

/** Currencies the store offers in its selector (same set as Fourthwall's demo store). */
export const STORE_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const;
export type StoreCurrency = (typeof STORE_CURRENCIES)[number];

export const DEFAULT_CURRENCY: StoreCurrency = 'USD';

/** Every currency code Fourthwall's Storefront API accepts. */
export const FOURTHWALL_CURRENCIES = [
  'USD', 'EUR', 'CAD', 'GBP', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK',
  'PLN', 'INR', 'JPY', 'MYR', 'SGD', 'MXN', 'BRL', 'CHF',
] as const;

export const SUPPORTED_STORE_CURRENCIES: readonly string[] = STORE_CURRENCIES;

export function isKnownCurrency(value: string): boolean {
  return (FOURTHWALL_CURRENCIES as readonly string[]).includes(value.toUpperCase());
}

export function isStoreCurrency(value: string): value is StoreCurrency {
  return (STORE_CURRENCIES as readonly string[]).includes(value);
}

/** Any input → a currency the store supports (falls back to USD). */
export function normalizeStoreCurrency(value: string | null | undefined): StoreCurrency {
  const upper = value?.trim().toUpperCase();
  return upper && isStoreCurrency(upper) ? upper : DEFAULT_CURRENCY;
}

export function productPath(slug: string, currency: string = DEFAULT_CURRENCY): string {
  return `/${currency.toUpperCase()}/product/${encodeURIComponent(slug)}`;
}

const PRODUCT_PATH_PREFIX = /^\/([A-Za-z]{3})\/product\//;

/** The currency in a /USD/product/… path, or null when the path isn't one. */
export function currencyFromProductPath(pathname: string): StoreCurrency | null {
  const match = PRODUCT_PATH_PREFIX.exec(pathname);
  const code = match?.[1]?.toUpperCase();
  return code && isStoreCurrency(code) ? code : null;
}

/** /USD/product/x → /EUR/product/x */
export function withCurrencyInProductPath(pathname: string, currency: string): string {
  return pathname.replace(PRODUCT_PATH_PREFIX, `/${currency}/product/`);
}
