/**
 * Fourthwall's documented direct-checkout link:
 *   https://{shop-domain}/cart/checkout?products={variantId}:{qty},{variantId}:{qty}
 * (https://docs.fourthwall.com/storefront/cart-checkout-tutorial)
 *
 * Pure string building — no API call and no secret, so it works from any
 * client component. Payment itself always happens on Fourthwall's own
 * checkout page; Fourthwall offers no embeddable/overlay checkout.
 */

export interface CheckoutLine {
  variantId: string;
  quantity: number;
}

/** NEXT_PUBLIC_ vars are inlined at build time, so this is safe client-side. */
export function getFourthwallStoreUrl(): string {
  return process.env.NEXT_PUBLIC_FOURTHWALL_STORE_URL ?? '';
}

function normalizeStoreUrl(storeUrl: string): string {
  const trimmed = storeUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function buildFourthwallCheckoutUrl(storeUrl: string, lines: CheckoutLine[]): string | null {
  const base = normalizeStoreUrl(storeUrl);
  const validLines = lines.filter((line) => line.variantId && line.quantity > 0);
  if (!base || validLines.length === 0) return null;

  const products = validLines
    .map((line) => `${encodeURIComponent(line.variantId)}:${Math.floor(line.quantity)}`)
    .join(',');

  return `${base}/cart/checkout?products=${products}`;
}

/** Link to a product's own page on the Fourthwall shop (used as a fallback). */
export function buildFourthwallProductUrl(storeUrl: string, slug: string): string | null {
  const base = normalizeStoreUrl(storeUrl);
  if (!base || !slug) return null;
  return `${base}/products/${encodeURIComponent(slug)}`;
}
