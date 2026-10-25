import { describe, expect, it } from 'vitest';
import { buildFourthwallCheckoutUrl, buildFourthwallProductUrl } from '@/lib/fourthwall/checkout';

describe('buildFourthwallCheckoutUrl', () => {
  it('builds the documented direct-checkout link for one variant', () => {
    expect(buildFourthwallCheckoutUrl('https://hageez-shop.fourthwall.com', [{ variantId: 'abc', quantity: 2 }])).toBe(
      'https://hageez-shop.fourthwall.com/cart/checkout?products=abc:2'
    );
  });

  it('joins multiple variants with commas', () => {
    const url = buildFourthwallCheckoutUrl('https://shop.example.com', [
      { variantId: 'a', quantity: 1 },
      { variantId: 'b', quantity: 3 },
    ]);
    expect(url).toBe('https://shop.example.com/cart/checkout?products=a:1,b:3');
  });

  it('tolerates a trailing slash and a missing https://', () => {
    expect(buildFourthwallCheckoutUrl('hageez-shop.fourthwall.com/', [{ variantId: 'a', quantity: 1 }])).toBe(
      'https://hageez-shop.fourthwall.com/cart/checkout?products=a:1'
    );
  });

  it('returns null when the store url or lines are missing', () => {
    expect(buildFourthwallCheckoutUrl('', [{ variantId: 'a', quantity: 1 }])).toBeNull();
    expect(buildFourthwallCheckoutUrl('https://shop.example.com', [])).toBeNull();
    expect(buildFourthwallCheckoutUrl('https://shop.example.com', [{ variantId: 'a', quantity: 0 }])).toBeNull();
  });
});

describe('buildFourthwallProductUrl', () => {
  it('links to the product page by slug', () => {
    expect(buildFourthwallProductUrl('https://hageez-shop.fourthwall.com', 'ethiopian-orthodox-cross-ceramic-mug')).toBe(
      'https://hageez-shop.fourthwall.com/products/ethiopian-orthodox-cross-ceramic-mug'
    );
  });
});
