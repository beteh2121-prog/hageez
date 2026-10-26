import type { FourthwallStorefrontProduct } from '@/lib/fourthwall/client';
import { CART_MAX_LINE_QUANTITY } from '@/lib/fourthwall/cart-types';

/**
 * A plain, serialisable description of a Fourthwall product that the
 * browser can render without any further requests: gallery, option groups
 * (Color / Size), and every variant with its price and stock.
 */

export interface ImageView {
  url: string;
  alt: string;
}

export interface OptionValueView {
  value: string;
  /** Colour hex from Fourthwall, when the option is a colour. */
  swatch?: string;
}

export interface OptionView {
  /** lower-case name used in the URL, e.g. "color" */
  key: string;
  /** display name, e.g. "Color" */
  name: string;
  values: OptionValueView[];
}

export interface VariantView {
  id: string;
  label: string;
  /** option key → value, e.g. { color: "Terracotta", size: "M" } */
  optionValues: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  images: ImageView[];
  available: boolean;
  maxQuantity: number;
  /** Set only for limited stock that is running low. */
  lowStock: number | null;
}

export interface ProductView {
  id: string;
  slug: string;
  name: string;
  currency: string;
  images: ImageView[];
  options: OptionView[];
  variants: VariantView[];
  soldOut: boolean;
}

const LOW_STOCK_THRESHOLD = 5;

function toImages(
  images: { url: string; transformedUrl?: string }[] | undefined,
  alt: string
): ImageView[] {
  return (images ?? []).map((image) => ({ url: image.transformedUrl || image.url, alt }));
}

export function buildProductView(product: FourthwallStorefrontProduct): ProductView {
  const soldOut = product.state?.type === 'SOLD_OUT';
  const rawVariants = product.variants ?? [];

  const colorValues = new Map<string, OptionValueView>();
  const sizeValues = new Map<string, OptionValueView>();

  for (const variant of rawVariants) {
    const color = variant.attributes?.color;
    if (color?.name && !colorValues.has(color.name)) {
      colorValues.set(color.name, { value: color.name, swatch: color.swatch });
    }
    const size = variant.attributes?.size?.name;
    if (size && !sizeValues.has(size)) sizeValues.set(size, { value: size });
  }

  const options: OptionView[] = [];
  if (colorValues.size > 0) options.push({ key: 'color', name: 'Color', values: [...colorValues.values()] });
  if (sizeValues.size > 0) options.push({ key: 'size', name: 'Size', values: [...sizeValues.values()] });

  const labelOf = (variant: (typeof rawVariants)[number]): string =>
    variant.attributes?.description || variant.name;

  // Unexpected attribute shape: fall back to one plain "Option" group so the
  // product can still be bought.
  const useFallbackGroup = options.length === 0 && rawVariants.length > 1;
  if (useFallbackGroup) {
    const seen = new Set<string>();
    const values: OptionValueView[] = [];
    for (const variant of rawVariants) {
      const label = labelOf(variant);
      if (!seen.has(label)) {
        seen.add(label);
        values.push({ value: label });
      }
    }
    options.push({ key: 'option', name: 'Option', values });
  }

  const productImages = toImages(product.images, product.name);

  const variants: VariantView[] = rawVariants.map((variant) => {
    const optionValues: Record<string, string> = {};
    if (variant.attributes?.color?.name) optionValues['color'] = variant.attributes.color.name;
    if (variant.attributes?.size?.name) optionValues['size'] = variant.attributes.size.name;
    if (useFallbackGroup) optionValues['option'] = labelOf(variant);

    const limited = variant.stock?.type === 'LIMITED';
    const inStock = limited ? Math.max(0, variant.stock?.inStock ?? 0) : null;
    const available = !soldOut && (inStock === null || inStock > 0);

    return {
      id: variant.id,
      label: labelOf(variant),
      optionValues,
      price: variant.unitPrice.value,
      compareAtPrice:
        variant.compareAtPrice && variant.compareAtPrice.value > variant.unitPrice.value
          ? variant.compareAtPrice.value
          : null,
      images: toImages(variant.images, product.name),
      available,
      maxQuantity: Math.max(1, Math.min(CART_MAX_LINE_QUANTITY, inStock ?? CART_MAX_LINE_QUANTITY)),
      lowStock: inStock !== null && inStock > 0 && inStock <= LOW_STOCK_THRESHOLD ? inStock : null,
    };
  });

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    currency: rawVariants[0]?.unitPrice.currency ?? product.price?.currency ?? 'USD',
    images: productImages,
    options,
    variants,
    soldOut,
  };
}

/** schema.org Product with an AggregateOffer across all variants. */
export function buildProductJsonLd(view: ProductView, url: string, description: string): Record<string, unknown> {
  const prices = view.variants.map((variant) => variant.price);
  const anyAvailable = view.variants.some((variant) => variant.available);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: view.name,
    description,
    url,
    image: view.images.map((image) => image.url),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: view.currency,
      lowPrice: prices.length ? Math.min(...prices) : 0,
      highPrice: prices.length ? Math.max(...prices) : 0,
      offerCount: view.variants.length,
      availability: anyAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}
