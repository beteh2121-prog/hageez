/**
 * Client for Fourthwall's Storefront API — confirmed against
 * https://docs.fourthwall.com/storefront-api as of this build. This is a
 * DIFFERENT API from the Platform API used for orders/webhooks: the
 * Storefront API is read-only, scoped to published products, and
 * authenticated with a simple storefront_token query param rather than
 * Basic Auth.
 *
 * Get a token: Fourthwall dashboard → Settings → For Developers →
 * Headless → Storefront API token.
 */

const STOREFRONT_API_BASE = 'https://storefront-api.fourthwall.com/v1';

export interface FourthwallStorefrontMoney {
  value: number;
  currency: string;
}

export interface FourthwallStorefrontImage {
  id: string;
  url: string;
  width: number;
  height: number;
  transformedUrl: string;
}

export interface FourthwallStorefrontVariant {
  id: string;
  name: string;
  sku: string;
  unitPrice: FourthwallStorefrontMoney;
  compareAtPrice?: FourthwallStorefrontMoney;
  images: FourthwallStorefrontImage[];
}

export interface FourthwallStorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  state: { type: string };
  access: { type: string };
  images: FourthwallStorefrontImage[];
  variants: FourthwallStorefrontVariant[];
  createdAt: string;
  updatedAt: string;
}

interface PagedResponse<T> {
  results: T[];
  paging: {
    pageNumber: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export class FourthwallApiError extends Error {}

function getStorefrontToken(): string {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) {
    throw new FourthwallApiError(
      'FOURTHWALL_STOREFRONT_TOKEN is not set. Get one from Fourthwall → Settings → For Developers → Headless.'
    );
  }
  return token;
}

/**
 * Fetches every product in the shop's built-in "all" collection — every
 * Fourthwall shop has this collection automatically, no setup required.
 * Paginated internally; returns the full combined list.
 */
export async function fetchAllFourthwallProducts(): Promise<FourthwallStorefrontProduct[]> {
  const token = getStorefrontToken();
  const products: FourthwallStorefrontProduct[] = [];
  let page = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    const url = `${STOREFRONT_API_BASE}/collections/all/products?storefront_token=${token}&page=${page}&size=50`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new FourthwallApiError(
        `Fourthwall Storefront API returned ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as PagedResponse<FourthwallStorefrontProduct>;
    products.push(...data.results);
    hasNextPage = data.paging.hasNextPage;
    page += 1;
  }

  return products;
}

/**
 * Fourthwall's Storefront API has no documented field that marks a
 * product as a "digital download" the way our schema needs — there is no
 * `digitalFiles` array in this API's product schema (that was a previous,
 * incorrect assumption in this codebase). Until Fourthwall exposes a real
 * signal for this via the Storefront API, the practical workaround is:
 * tag digital products with a recognizable naming convention in
 * Fourthwall itself (e.g. a tag/prefix in the product name, or putting
 * them in a separate Fourthwall collection named "digital"), and detect
 * that here. This function checks for a literal "[digital]" prefix or
 * suffix in the product name as a simple, visible, creator-controlled
 * signal — rename in Fourthwall's dashboard to (re)classify a product.
 */
export function isDigitalProductByNaming(product: FourthwallStorefrontProduct): boolean {
  const name = product.name.toLowerCase();
  return name.includes('[digital]');
}
