import { describe, expect, it } from 'vitest';
import { formatPrice } from '@/lib/utils/formatPrice';

describe('formatPrice', () => {
  it('returns "Free" for 0 cents', () => {
    expect(formatPrice(0)).toBe('Free');
  });

  it('formats 999 cents as $9.99', () => {
    expect(formatPrice(999)).toBe('$9.99');
  });

  it('formats 10000 cents as $100.00', () => {
    expect(formatPrice(10000)).toBe('$100.00');
  });

  it('formats 1299 cents as a Euro-formatted string when currency is EUR', () => {
    const result = formatPrice(1299, 'EUR');
    expect(result).toContain('12.99');
    expect(result).toContain('€');
  });
});
