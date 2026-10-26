import {
  fetchAllFourthwallProducts,
  lowestPriceCents,
  type FourthwallStorefrontProduct,
} from '@/lib/fourthwall/client';

export interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  /** true when variants have different prices ("From $25.00") */
  hasPriceRange: boolean;
  currency: string;
}

export function toRelatedProduct(product: FourthwallStorefrontProduct, currency: string): RelatedProduct {
  const prices = (product.variants ?? []).map((variant) => Math.round(variant.unitPrice.value * 100));
  const image = product.images?.[0];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageUrl: image?.transformedUrl || image?.url || null,
    priceCents: lowestPriceCents(product),
    hasPriceRange: prices.length > 1 && Math.min(...prices) !== Math.max(...prices),
    currency: product.variants?.[0]?.unitPrice.currency ?? product.price?.currency ?? currency,
  };
}

/**
 * Picks up to `limit` other products: ones that share tags with the current
 * product first (`preferIds`), then the rest of the catalog in shop order.
 * Pure so it can be tested without the network.
 */
export function pickRelated(
  catalog: FourthwallStorefrontProduct[],
  currentId: string,
  currency: string,
  preferIds: string[] = [],
  limit = 4
): RelatedProduct[] {
  const others = catalog.filter((product) => product.id !== currentId);
  const preferred = others.filter((product) => preferIds.includes(product.id));
  const rest = others.filter((product) => !preferIds.includes(product.id));
  return [...preferred, ...rest].slice(0, limit).map((product) => toRelatedProduct(product, currency));
}

/** Related products priced in the shopper's currency. Returns [] if Fourthwall can't be reached. */
export async function getRelatedProducts(params: {
  currentId: string;
  currency: string;
  preferIds?: string[];
  limit?: number;
}): Promise<RelatedProduct[]> {
  try {
    const catalog = await fetchAllFourthwallProducts({ currency: params.currency, revalidate: 300 });
    return pickRelated(catalog, params.currentId, params.currency, params.preferIds, params.limit);
  } catch {
    return [];
  }
}
