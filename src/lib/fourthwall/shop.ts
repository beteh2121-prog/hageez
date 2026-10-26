import { normalizeStoreUrl } from '@/lib/fourthwall/checkout';

/**
 * Resolves the real Fourthwall checkout origin (e.g. https://shop.example.com)
 * by asking Fourthwall itself — GET /v1/shop — instead of trusting a
 * hand-typed env var. This is the same approach Fourthwall's own
 * vercel-commerce template uses: prefer the shop's `publicDomain`
 * (custom domain), else `{domain}.fourthwall.com`.
 *
 * Falls back to FOURTHWALL_STORE_URL / NEXT_PUBLIC_FOURTHWALL_STORE_URL so a
 * temporary API hiccup never takes checkout down. Server-side only: the
 * storefront token is a runtime secret on the Worker.
 */

const STOREFRONT_API_BASE = 'https://storefront-api.fourthwall.com/v1';

interface FourthwallShopResponse {
  domain?: string;
  publicDomain?: string;
}

export function originFromShop(shop: FourthwallShopResponse): string {
  const publicDomain = shop.publicDomain?.trim();
  if (publicDomain) return normalizeStoreUrl(publicDomain);

  const domain = shop.domain?.trim();
  if (!domain) return '';
  // `domain` is the shop's subdomain label; tolerate a full host too.
  return normalizeStoreUrl(domain.includes('.') ? domain : `${domain}.fourthwall.com`);
}

function envFallbackOrigin(): string {
  return normalizeStoreUrl(
    process.env.FOURTHWALL_STORE_URL ?? process.env.NEXT_PUBLIC_FOURTHWALL_STORE_URL ?? ''
  );
}

export interface CheckoutOriginResult {
  origin: string;
  source: 'fourthwall-api' | 'env' | 'none';
}

export async function resolveCheckoutOrigin(): Promise<CheckoutOriginResult> {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;

  if (token) {
    try {
      const response = await fetch(
        `${STOREFRONT_API_BASE}/shop?storefront_token=${encodeURIComponent(token)}`,
        { next: { revalidate: 3600, tags: ['fw-shop'] } }
      );
      if (response.ok) {
        const origin = originFromShop((await response.json()) as FourthwallShopResponse);
        if (origin) return { origin, source: 'fourthwall-api' };
      }
    } catch {
      // fall through to the env fallback
    }
  }

  const fallback = envFallbackOrigin();
  return fallback ? { origin: fallback, source: 'env' } : { origin: '', source: 'none' };
}

export async function getCheckoutOrigin(): Promise<string> {
  return (await resolveCheckoutOrigin()).origin;
}
