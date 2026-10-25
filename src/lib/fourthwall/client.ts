/**
 * Fourthwall Storefront API client (read-only).
 * Verified against https://docs.fourthwall.com/storefront/products
 *
 * Auth: `storefront_token` query param. Products are identified by SLUG in
 * single-product lookups (GET /v1/products/{slug}), not by id.
 *
 * Checkout does NOT use this API at all — see ./checkout.ts. Fourthwall's
 * documented direct-checkout link only needs variant ids, which we already
 * get from product data here.
 */

const STOREFRONT_API_BASE = 'https://storefront-api.fourthwall.com/v1';

export interface FourthwallStorefrontMoney {
  value: number;
  currency: string;
}

export interface FourthwallStorefrontImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
  transformedUrl?: string;
}

export interface FourthwallVariantAttributes {
  description?: string;
  color?: { name?: string; swatch?: string };
  size?: { name?: string };
}

export interface FourthwallStorefrontVariant {
  id: string;
  name: string;
  sku?: string;
  unitPrice: FourthwallStorefrontMoney;
  compareAtPrice?: FourthwallStorefrontMoney;
  attributes?: FourthwallVariantAttributes;
  images?: FourthwallStorefrontImage[];
}

export interface FourthwallStorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  // PRODUCT has variants; BUNDLE has no variants and carries a `price`.
  type?: 'PRODUCT' | 'BUNDLE' | string;
  // Real values per the docs: AVAILABLE | SOLD_OUT
  state?: { type?: string };
  images: FourthwallStorefrontImage[];
  variants?: FourthwallStorefrontVariant[];
  price?: FourthwallStorefrontMoney;
  createdAt?: string;
  updatedAt?: string;
}

interface PagedResponse<T> {
  results: T[];
  paging?: {
    pageNumber?: number;
    totalPages?: number;
    hasNextPage?: boolean;
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

/** Every product in the built-in "all" collection (paginated internally). */
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
    products.push(...(data.results ?? []));
    hasNextPage = data.paging?.hasNextPage ?? false;
    page += 1;
  }

  return products;
}

export async function fetchFourthwallProductBySlug(
  slug: string
): Promise<FourthwallStorefrontProduct | null> {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token || !slug) return null;
  try {
    const response = await fetch(
      `${STOREFRONT_API_BASE}/products/${encodeURIComponent(slug)}?storefront_token=${token}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    return (await response.json()) as FourthwallStorefrontProduct;
  } catch {
    return null;
  }
}

/**
 * Finds a product by Fourthwall slug first (one cheap request), then falls
 * back to scanning the full catalog by id. The fallback matters because rows
 * synced before this fix stored a title-derived slug that may not match
 * Fourthwall's real one.
 */
export async function findFourthwallProduct(params: {
  id: string;
  slug: string;
}): Promise<FourthwallStorefrontProduct | null> {
  const bySlug = await fetchFourthwallProductBySlug(params.slug);
  if (bySlug && bySlug.id === params.id) return bySlug;

  try {
    const all = await fetchAllFourthwallProducts();
    return all.find((product) => product.id === params.id) ?? null;
  } catch {
    return null;
  }
}

/** Lowest variant price in cents; bundles (no variants) use their own price. */
export function lowestPriceCents(product: FourthwallStorefrontProduct): number {
  const variantPrices = (product.variants ?? []).map((variant) => variant.unitPrice.value);
  if (variantPrices.length > 0) {
    return Math.round(Math.min(...variantPrices) * 100);
  }
  return Math.round((product.price?.value ?? 0) * 100);
}

export function isSoldOut(product: FourthwallStorefrontProduct): boolean {
  return product.state?.type === 'SOLD_OUT';
}
