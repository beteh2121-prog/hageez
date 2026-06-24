export type AmazonMarketplace = 'com' | 'co.uk' | 'de' | 'ca' | 'com.au';

export interface AffiliateUrlOptions {
  tag?: string;
  marketplace?: AmazonMarketplace;
}

export class AffiliateUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AffiliateUrlError';
  }
}

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

const MARKETPLACE_DOMAINS: Record<AmazonMarketplace, string> = {
  com: 'amazon.com',
  'co.uk': 'amazon.co.uk',
  de: 'amazon.de',
  ca: 'amazon.ca',
  'com.au': 'amazon.com.au',
};

function assertValidAsin(asin: string): void {
  if (!ASIN_PATTERN.test(asin)) {
    throw new AffiliateUrlError(
      `Invalid ASIN "${asin}": must be exactly 10 uppercase alphanumeric characters.`
    );
  }
}

function resolveTag(explicitTag?: string): string {
  const tag = explicitTag ?? process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ?? process.env.AMAZON_AFFILIATE_TAG;
  if (!tag) {
    throw new AffiliateUrlError('Missing AMAZON_AFFILIATE_TAG environment variable.');
  }
  return tag;
}

export function buildAffiliateUrl(asin: string): string {
  assertValidAsin(asin);
  const tag = resolveTag();
  return `https://www.amazon.com/dp/${asin}?tag=${tag}`;
}

export function buildMarketplaceUrl(asin: string, marketplace: AmazonMarketplace): string {
  assertValidAsin(asin);
  const tag = resolveTag();
  const domain = MARKETPLACE_DOMAINS[marketplace];
  return `https://www.${domain}/dp/${asin}?tag=${tag}`;
}

export function extractAsinFromUrl(amazonUrl: string): string | null {
  const patterns = [/\/dp\/([A-Z0-9]{10})/, /\/gp\/product\/([A-Z0-9]{10})/, /\/d\/([A-Z0-9]{10})/];
  for (const pattern of patterns) {
    const match = amazonUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}
