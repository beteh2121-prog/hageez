import { describe, expect, it } from 'vitest';
import type { FourthwallStorefrontProduct } from '@/lib/fourthwall/client';
import { buildProductJsonLd, buildProductView } from '@/lib/fourthwall/product-view';
import {
  buildSearch,
  defaultSelection,
  isValueAvailable,
  parseSelection,
  resolveVariant,
  selectOption,
  selectableOptions,
} from '@/lib/fourthwall/selection';
import { DEFAULT_CURRENCY, isKnownCurrency, productPath } from '@/lib/fourthwall/routes';

function variant(
  id: string,
  color: string,
  size: string,
  stock: { type: string; inStock?: number } = { type: 'UNLIMITED' }
) {
  return {
    id,
    name: `Tee - ${color}, ${size}`,
    unitPrice: { value: 25, currency: 'USD' },
    attributes: { description: `${color}, ${size}`, color: { name: color, swatch: '#aa5533' }, size: { name: size } },
    images: [{ id: `${id}-img`, url: `https://img/${color}.png` }],
    stock,
  };
}

const product: FourthwallStorefrontProduct = {
  id: 'p1',
  name: 'Launch T-Shirt',
  slug: 'launch-t-shirt',
  images: [{ id: 'i1', url: 'https://img/main.png', transformedUrl: 'https://img/main-t.png' }],
  state: { type: 'AVAILABLE' },
  variants: [
    variant('v1', 'Black', 'S', { type: 'LIMITED', inStock: 0 }), // sold out
    variant('v2', 'Black', 'M'),
    variant('v3', 'Terracotta', 'S'),
    variant('v4', 'Terracotta', 'M', { type: 'LIMITED', inStock: 3 }),
  ],
};

const view = buildProductView(product);

describe('buildProductView', () => {
  it('builds Color and Size groups with swatches', () => {
    expect(view.options.map((o) => o.key)).toEqual(['color', 'size']);
    expect(view.options[0]?.values.map((v) => v.value)).toEqual(['Black', 'Terracotta']);
    expect(view.options[0]?.values[0]?.swatch).toBe('#aa5533');
  });

  it('marks stock correctly', () => {
    expect(view.variants.find((v) => v.id === 'v1')?.available).toBe(false);
    const limited = view.variants.find((v) => v.id === 'v4');
    expect(limited?.available).toBe(true);
    expect(limited?.maxQuantity).toBe(3);
    expect(limited?.lowStock).toBe(3);
  });

  it('prefers the transformed image url', () => {
    expect(view.images[0]?.url).toBe('https://img/main-t.png');
  });

  it('marks everything unavailable when the product is sold out', () => {
    const soldOut = buildProductView({ ...product, state: { type: 'SOLD_OUT' } });
    expect(soldOut.soldOut).toBe(true);
    expect(soldOut.variants.every((v) => !v.available)).toBe(true);
  });

  it('falls back to a single Option group when there is no color or size', () => {
    const plain = buildProductView({
      ...product,
      variants: [
        { id: 'a', name: 'Small mug', unitPrice: { value: 10, currency: 'USD' } },
        { id: 'b', name: 'Large mug', unitPrice: { value: 14, currency: 'USD' } },
      ],
    });
    expect(plain.options.map((o) => o.key)).toEqual(['option']);
    expect(resolveVariant(plain, { option: 'Large mug' })?.id).toBe('b');
  });

  it('describes the product for search engines', () => {
    const ld = buildProductJsonLd(view, 'https://x/USD/product/launch-t-shirt', 'A tee');
    expect(ld['@type']).toBe('Product');
    expect(JSON.stringify(ld)).toContain('InStock');
  });
});

describe('selection', () => {
  it('starts on the first variant that can be bought', () => {
    expect(defaultSelection(view)).toEqual({ color: 'Black', size: 'M' });
  });

  it('resolves the variant for a selection', () => {
    expect(resolveVariant(view, { color: 'Terracotta', size: 'S' })?.id).toBe('v3');
  });

  it('keeps a sold-out combination selected so the shopper sees "out of stock"', () => {
    const next = selectOption(view, { color: 'Black', size: 'M' }, 'size', 'S');
    expect(next).toEqual({ color: 'Black', size: 'S' });
    expect(resolveVariant(view, next)?.available).toBe(false);
  });

  it('moves other options when the combination does not exist at all', () => {
    const sparse = buildProductView({
      ...product,
      variants: [variant('a', 'Black', 'S'), variant('b', 'Terracotta', 'M')],
    });
    const next = selectOption(sparse, { color: 'Black', size: 'S' }, 'size', 'M');
    expect(next).toEqual({ color: 'Terracotta', size: 'M' });
    expect(resolveVariant(sparse, next)?.id).toBe('b');
  });

  it('disables values that have no buyable variant', () => {
    const allSoldOut = buildProductView({ ...product, variants: [variant('x', 'Black', 'S', { type: 'LIMITED', inStock: 0 }), variant('y', 'Terracotta', 'S')] });
    expect(isValueAvailable(allSoldOut, 'color', 'Black')).toBe(false);
    expect(isValueAvailable(allSoldOut, 'color', 'Terracotta')).toBe(true);
  });

  it('shows only options with a real choice', () => {
    expect(selectableOptions(view)).toHaveLength(2);
  });
});

describe('URL state', () => {
  it('opens on the variant named in the link, case-insensitively', () => {
    const parsed = parseSelection(view, '?color=terracotta&size=M&image=2');
    expect(parsed.selection).toEqual({ color: 'Terracotta', size: 'M' });
    expect(parsed.image).toBe(2);
  });

  it('ignores junk values', () => {
    expect(parseSelection(view, '?color=Purple&image=abc').selection).toEqual(defaultSelection(view));
    expect(parseSelection(view, '?image=-4').image).toBe(0);
  });

  it('writes options back and keeps unrelated params', () => {
    const search = buildSearch('?utm_source=x', view, { color: 'Terracotta', size: 'M' }, 0);
    const params = new URLSearchParams(search);
    expect(params.get('color')).toBe('Terracotta');
    expect(params.get('size')).toBe('M');
    expect(params.get('utm_source')).toBe('x');
    expect(params.has('image')).toBe(false);
  });

  it('only includes image when it is not the first', () => {
    expect(buildSearch('', view, { color: 'Black', size: 'M' }, 3)).toContain('image=3');
  });
});

describe('productPath', () => {
  it('matches the Fourthwall storefront format', () => {
    expect(productPath('launch-t-shirt')).toBe('/USD/product/launch-t-shirt');
    expect(productPath('mug', 'usd')).toBe('/USD/product/mug');
    expect(DEFAULT_CURRENCY).toBe('USD');
  });

  it('knows real currency codes', () => {
    expect(isKnownCurrency('usd')).toBe(true);
    expect(isKnownCurrency('shop')).toBe(false);
  });
});
