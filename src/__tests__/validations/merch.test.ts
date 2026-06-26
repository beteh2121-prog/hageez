import { describe, expect, it } from 'vitest';
import { CreateMerchSchema } from '@/lib/validations/merch';

const validMerch = {
  title: 'Hand-Carved Wooden Cross',
  slug: 'hand-carved-wooden-cross',
  description: 'A beautiful hand-carved wooden cross, made by local artisans.',
  price_cents: 2500,
  currency: 'USD' as const,
  images: [{ url: 'https://example.com/cross.jpg', alt: 'Hand-carved wooden cross' }],
  tags: ['cross', 'wood'],
  category: 'Crafts',
  status: 'active' as const,
  featured: false,
};

describe('CreateMerchSchema', () => {
  it('rejects price_cents = -100', () => {
    const result = CreateMerchSchema.safeParse({ ...validMerch, price_cents: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects price_cents = 0', () => {
    const result = CreateMerchSchema.safeParse({ ...validMerch, price_cents: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects slug 'my product' (spaces not allowed)", () => {
    const result = CreateMerchSchema.safeParse({ ...validMerch, slug: 'my product' });
    expect(result.success).toBe(false);
  });

  it("rejects slug 'My-Product' (uppercase not allowed)", () => {
    const result = CreateMerchSchema.safeParse({ ...validMerch, slug: 'My-Product' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid complete object', () => {
    const result = CreateMerchSchema.safeParse(validMerch);
    expect(result.success).toBe(true);
  });

  it('rejects a seo_title over 60 characters', () => {
    const result = CreateMerchSchema.safeParse({ ...validMerch, seo_title: 'a'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('rejects a seo_description over 160 characters', () => {
    const result = CreateMerchSchema.safeParse({ ...validMerch, seo_description: 'a'.repeat(161) });
    expect(result.success).toBe(false);
  });
});
