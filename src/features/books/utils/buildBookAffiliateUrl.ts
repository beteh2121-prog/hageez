import type { KdpBook } from '@/types';
import { buildMarketplaceUrl } from '@/lib/amazon/affiliate';

export function buildBookAffiliateUrl(book: KdpBook): string {
  return buildMarketplaceUrl(book.asin, book.marketplace);
}
