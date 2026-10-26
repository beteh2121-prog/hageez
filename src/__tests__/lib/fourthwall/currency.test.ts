import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORE_CURRENCIES,
  currencyFromProductPath,
  isStoreCurrency,
  normalizeStoreCurrency,
  withCurrencyInProductPath,
} from '@/lib/fourthwall/routes';
import { formatPriceWithCode } from '@/lib/utils/formatPrice';
import { pickRelated, toRelatedProduct } from '@/lib/fourthwall/related';
import { createCart } from '@/lib/fourthwall/cart';
import type { FourthwallStorefrontProduct } from '@/lib/fourthwall/client';

describe('store currencies', () => {
  it('offers the same six currencies as the Fourthwall demo store', () => {
    expect([...STORE_CURRENCIES]).toEqual(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']);
    expect(isStoreCurrency('EUR')).toBe(true);
    expect(isStoreCurrency('SEK')).toBe(false);
  });

  it('falls back to USD for anything unsupported', () => {
    expect(normalizeStoreCurrency('eur')).toBe('EUR');
    expect(normalizeStoreCurrency('XYZ')).toBe('USD');
    expect(normalizeStoreCurrency(null)).toBe('USD');
  });

  it('reads and swaps the currency in a product path', () => {
    expect(currencyFromProductPath('/EUR/product/launch-t-shirt')).toBe('EUR');
    expect(currencyFromProductPath('/shop')).toBeNull();
    expect(currencyFromProductPath('/SEK/product/x')).toBeNull();
    expect(withCurrencyInProductPath('/USD/product/launch-t-shirt', 'GBP')).toBe('/GBP/product/launch-t-shirt');
  });
});

describe('formatPriceWithCode', () => {
  it('shows the symbol and the code, like the Fourthwall demo', () => {
    expect(formatPriceWithCode(3100, 'USD')).toBe('$31.00 USD');
    expect(formatPriceWithCode(2826, 'EUR')).toBe('€28.26 EUR');
    expect(formatPriceWithCode(2000, 'GBP')).toBe('£20.00 GBP');
  });

  it('uses no decimals for yen', () => {
    expect(formatPriceWithCode(450000, 'JPY')).toBe('¥4,500 JPY');
  });
});

function product(id: string, name: string, prices: number[], currency = 'USD'): FourthwallStorefrontProduct {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    images: [{ id: `${id}i`, url: `https://img/${id}.png`, transformedUrl: `https://img/${id}-t.png` }],
    variants: prices.map((value, i) => ({ id: `${id}-v${i}`, name: `v${i}`, unitPrice: { value, currency } })),
  };
}

describe('related products', () => {
  const catalog = [product('a', 'Cap', [20]), product('b', 'Mug', [10, 14]), product('c', 'Hoodie', [45]), product('d', 'Tote', [15]), product('e', 'Sticker', [3]), product('f', 'Pin', [5])];

  it('never includes the current product and caps the list', () => {
    const related = pickRelated(catalog, 'a', 'USD');
    expect(related.map((p) => p.id)).toEqual(['b', 'c', 'd', 'e']);
  });

  it('puts same-tag products first', () => {
    const related = pickRelated(catalog, 'a', 'USD', ['d', 'f']);
    expect(related.slice(0, 2).map((p) => p.id)).toEqual(['d', 'f']);
  });

  it('shows a "from" price when variants differ and keeps the currency', () => {
    const mug = toRelatedProduct(product('b', 'Mug', [10, 14], 'EUR'), 'EUR');
    expect(mug).toMatchObject({ priceCents: 1000, hasPriceRange: true, currency: 'EUR', imageUrl: 'https://img/b-t.png' });
    expect(toRelatedProduct(product('a', 'Cap', [20]), 'USD').hasPriceRange).toBe(false);
  });
});

describe('cart requests carry the shopper currency', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.FOURTHWALL_STOREFRONT_TOKEN = 'tok_test';
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'cart_1', items: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.FOURTHWALL_STOREFRONT_TOKEN;
  });

  it('passes the currency to Fourthwall and returns it on an empty cart', async () => {
    const cart = await createCart([], 'EUR');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/carts?');
    expect(url).toContain('currency=EUR');
    expect(cart.currency).toBe('EUR');
  });
});
