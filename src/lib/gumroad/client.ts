/**
 * Client for Gumroad's v2 API — confirmed against
 * https://mintlify.wiki/antiwork/gumroad/api/overview as of this build.
 *
 * Auth: a personal access token works for managing your own account
 * (no OAuth flow needed). Generate one at gumroad.com → Settings →
 * Advanced → Applications → create an application → copy the
 * "Access Token" shown there directly (skip the OAuth redirect dance,
 * which is only needed for apps acting on *other* users' accounts).
 */

const GUMROAD_API_BASE = 'https://api.gumroad.com/v2';

export interface GumroadProduct {
  id: string;
  name: string;
  // `short_url` is the public product/checkout page (e.g.
  // https://you.gumroad.com/l/permalink). `url` is NOT reliably that page.
  short_url?: string | null;
  url?: string | null;
  description: string;
  preview_url: string | null;
  thumbnail_url: string | null;
  price: number; // cents
  currency: string;
  formatted_price: string;
  published: boolean;
  // Gumroad's API does not document a single stable "is this digital"
  // boolean — every product on Gumroad is fundamentally a digital
  // download by default (Gumroad does not handle physical fulfillment),
  // so every product returned by this API is treated as a `downloads`
  // row in our schema. There is no merch/physical branch for Gumroad.
}

interface GumroadProductsResponse {
  success: boolean;
  products?: GumroadProduct[];
  message?: string;
}

export class GumroadApiError extends Error {}

/** The public Gumroad page customers buy from, or null if none is usable. */
export function getGumroadProductUrl(product: GumroadProduct): string | null {
  const candidates = [product.short_url, product.url];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'https:' && /(^|\.)(gumroad\.com|gum\.co)$/i.test(parsed.hostname)) {
        return parsed.toString();
      }
    } catch {
      // not a valid URL — try the next candidate
    }
  }
  return null;
}

function getAccessToken(): string {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) {
    throw new GumroadApiError(
      'GUMROAD_ACCESS_TOKEN is not set. Generate one at gumroad.com → Settings → Advanced → Applications.'
    );
  }
  return token;
}

export async function fetchAllGumroadProducts(): Promise<GumroadProduct[]> {
  const token = getAccessToken();
  const response = await fetch(`${GUMROAD_API_BASE}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new GumroadApiError(`Gumroad API returned ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GumroadProductsResponse;

  if (!data.success) {
    throw new GumroadApiError(data.message ?? 'Gumroad API request failed.');
  }

  return data.products ?? [];
}
