import type { Download, KdpBook, Merch } from '@/types';
import { buildAffiliateUrl } from '@/lib/amazon/affiliate';

const SITE_NAME = 'Ethiopian Orthodox Heritage';

export function buildProductSchema(product: Merch): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.map((img) => img.url),
    sku: product.fourthwall_id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    keywords: (product.seo_keywords ?? product.tags).join(', '),
    offers: {
      '@type': 'Offer',
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: product.currency,
      availability:
        product.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export function buildBookSchema(book: KdpBook): Record<string, unknown> {
  let offerUrl: string | undefined;
  try {
    offerUrl = buildAffiliateUrl(book.asin);
  } catch {
    offerUrl = undefined;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: book.author },
    description: book.custom_description ?? book.description ?? undefined,
    image: book.cover_image_url ?? undefined,
    numberOfPages: book.page_count ?? undefined,
    inLanguage: book.language,
    datePublished: book.published_date ?? undefined,
    isbn: book.asin,
    keywords: (book.seo_keywords ?? [...book.tags, ...book.categories]).join(', '),
    offers: book.price_usd
      ? {
          '@type': 'Offer',
          price: book.price_usd,
          priceCurrency: 'USD',
          url: offerUrl,
        }
      : undefined,
  };
}

export function buildDigitalDocumentSchema(download: Download): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: download.title,
    description: download.description ?? undefined,
    encodingFormat: download.file_type,
    offers: {
      '@type': 'Offer',
      price: (download.price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
    },
  };
}
