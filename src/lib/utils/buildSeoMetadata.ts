import type { Download, KdpBook, Merch } from '@/types';
import { productPath } from '@/lib/fourthwall/routes';

const SITE_NAME = 'Ethiopian Orthodox Heritage';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonicalUrl: string;
  focusKeyword: string;
}

export function buildMerchSeo(product: Merch, siteUrl: string): SeoMetadata {
  return {
    title: product.seo_title ?? `${product.title} | ${SITE_NAME}`,
    description: product.seo_description ?? product.description?.slice(0, 155) ?? '',
    keywords: product.seo_keywords ?? product.tags,
    ogImage: product.og_image_url ?? product.images[0]?.url ?? '',
    canonicalUrl: `${siteUrl}${productPath(product.slug)}`,
    focusKeyword: product.focus_keyword ?? '',
  };
}

export function buildDownloadSeo(download: Download, siteUrl: string): SeoMetadata {
  return {
    title: download.seo_title ?? `${download.title} | ${SITE_NAME}`,
    description: download.seo_description ?? download.description?.slice(0, 155) ?? '',
    keywords: download.seo_keywords ?? [],
    ogImage: download.og_image_url ?? download.cover_path ?? '',
    canonicalUrl: `${siteUrl}/downloads/${download.slug}`,
    focusKeyword: download.focus_keyword ?? '',
  };
}

export function buildBookSeo(book: KdpBook, siteUrl: string): SeoMetadata {
  return {
    title: book.seo_title ?? `${book.title} by ${book.author} | ${SITE_NAME}`,
    description: book.seo_description ?? book.description?.slice(0, 155) ?? '',
    keywords: book.seo_keywords ?? [...book.tags, ...book.categories],
    ogImage: book.og_image_url ?? book.cover_image_url ?? '',
    canonicalUrl: `${siteUrl}/books/${book.asin}`,
    focusKeyword: book.focus_keyword ?? '',
  };
}
