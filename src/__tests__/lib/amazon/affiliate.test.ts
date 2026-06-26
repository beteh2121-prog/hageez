import { beforeEach, describe, expect, it } from 'vitest';
import { AffiliateUrlError, buildAffiliateUrl, buildMarketplaceUrl, extractAsinFromUrl } from '@/lib/amazon/affiliate';

beforeEach(() => {
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG = 'testsite-20';
});

describe('buildAffiliateUrl', () => {
  it("contains '?tag=' in the URL", () => {
    const url = buildAffiliateUrl('B08XYZ1234');
    expect(url).toContain('?tag=');
  });

  it('throws AffiliateUrlError for a lowercase ASIN', () => {
    expect(() => buildAffiliateUrl('b08xyz1234')).toThrow(AffiliateUrlError);
  });
});

describe('buildMarketplaceUrl', () => {
  it("contains 'amazon.co.uk' for the co.uk marketplace", () => {
    const url = buildMarketplaceUrl('B08XYZ1234', 'co.uk');
    expect(url).toContain('amazon.co.uk');
  });
});

describe('extractAsinFromUrl', () => {
  it("returns 'B08XYZ1234' for a /dp/ URL", () => {
    expect(extractAsinFromUrl('amazon.com/dp/B08XYZ1234')).toBe('B08XYZ1234');
  });

  it("returns 'B08XYZ1234' for a /gp/product/ URL", () => {
    expect(extractAsinFromUrl('amazon.com/gp/product/B08XYZ1234')).toBe('B08XYZ1234');
  });

  it('returns null for a non-Amazon URL', () => {
    expect(extractAsinFromUrl('https://google.com')).toBeNull();
  });
});
