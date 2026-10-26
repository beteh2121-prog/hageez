import { describe, expect, it } from 'vitest';
import { originFromShop } from '@/lib/fourthwall/shop';
import { normalizeStoreUrl } from '@/lib/fourthwall/checkout';

describe('originFromShop', () => {
  it('prefers the public (custom) domain', () => {
    expect(originFromShop({ domain: 'hageez-shop', publicDomain: 'shop.hageez.com' })).toBe('https://shop.hageez.com');
  });

  it('falls back to {domain}.fourthwall.com', () => {
    expect(originFromShop({ domain: 'hageez-shop' })).toBe('https://hageez-shop.fourthwall.com');
  });

  it('accepts a domain that is already a full host', () => {
    expect(originFromShop({ domain: 'hageez-shop.fourthwall.com' })).toBe('https://hageez-shop.fourthwall.com');
  });

  it('returns an empty string when Fourthwall gives nothing usable', () => {
    expect(originFromShop({})).toBe('');
  });
});

describe('normalizeStoreUrl', () => {
  it('reduces any pasted URL to scheme + host', () => {
    expect(normalizeStoreUrl('https://hageez-shop.fourthwall.com/products/mug?x=1')).toBe(
      'https://hageez-shop.fourthwall.com'
    );
    expect(normalizeStoreUrl(' hageez-shop.fourthwall.com/ ')).toBe('https://hageez-shop.fourthwall.com');
  });

  it('returns an empty string for blank or invalid input', () => {
    expect(normalizeStoreUrl('')).toBe('');
    expect(normalizeStoreUrl('http://')).toBe('');
  });
});
