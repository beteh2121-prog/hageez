import { describe, expect, it } from 'vitest';
import { buildCartCheckoutUrl, friendlyCartMessage, reshapeCart } from '@/lib/fourthwall/cart';
import { applyOptimistic } from '@/hooks/useCart';
import { CartMutationSchema, CheckoutRequestSchema } from '@/lib/fourthwall/cart-schemas';
import { EMPTY_CART } from '@/lib/fourthwall/cart-types';

const rawCart = {
  id: 'cart_123',
  items: [
    {
      quantity: 2,
      variant: {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Mug - White',
        unitPrice: { value: 14.5, currency: 'USD' },
        attributes: { description: 'White' },
        images: [{ url: 'https://img/a.png', transformedUrl: 'https://img/a-t.png' }],
        stock: { type: 'LIMITED', inStock: 5 },
        product: { id: 'p1', name: 'Cross Mug', slug: 'cross-mug' },
      },
    },
    { quantity: 1, variant: { id: '00000000-0000-4000-8000-000000000002', unitPrice: { value: 20, currency: 'USD' } } },
    { quantity: 0, variant: { id: '00000000-0000-4000-8000-000000000003' } },
    { quantity: 1 },
  ],
};

describe('reshapeCart', () => {
  const cart = reshapeCart(rawCart);

  it('keeps valid lines and drops empty or malformed ones', () => {
    expect(cart.lines).toHaveLength(2);
  });

  it('maps a full line', () => {
    expect(cart.lines[0]).toMatchObject({
      productName: 'Cross Mug',
      productSlug: 'cross-mug',
      variantLabel: 'White',
      quantity: 2,
      unitPriceCents: 1450,
      imageUrl: 'https://img/a-t.png',
      stockLimit: 5,
    });
  });

  it('treats missing stock info as unlimited', () => {
    expect(cart.lines[1]?.stockLimit).toBeNull();
  });

  it('totals quantity and subtotal in cents', () => {
    expect(cart.totalQuantity).toBe(3);
    expect(cart.subtotalCents).toBe(2 * 1450 + 2000);
    expect(cart.id).toBe('cart_123');
  });

  it('handles an empty response', () => {
    expect(reshapeCart({}).lines).toEqual([]);
  });
});

describe('buildCartCheckoutUrl', () => {
  it('builds the documented cartId checkout link', () => {
    expect(buildCartCheckoutUrl('https://shop.example.com', 'cart_123', 'USD')).toBe(
      'https://shop.example.com/cart/checkout?cartId=cart_123&currency=USD'
    );
  });
});

describe('friendlyCartMessage', () => {
  it('translates known Fourthwall error codes', () => {
    expect(friendlyCartMessage('CART_QUANTITY_TOO_HIGH')).toMatch(/stock/i);
  });

  it('has a safe default', () => {
    expect(friendlyCartMessage('SOMETHING_NEW')).toMatch(/try again/i);
  });
});

describe('applyOptimistic', () => {
  const base = reshapeCart(rawCart);
  const first = base.lines[0]?.variantId ?? '';

  it('updates a quantity and recomputes totals', () => {
    const next = applyOptimistic(base, { action: 'set', variantId: first, quantity: 4 });
    expect(next.lines[0]?.quantity).toBe(4);
    expect(next.totalQuantity).toBe(5);
  });

  it('removes a line', () => {
    const next = applyOptimistic(base, { action: 'remove', variantId: first });
    expect(next.lines).toHaveLength(1);
  });

  it('leaves the cart alone for adds (server decides)', () => {
    expect(applyOptimistic(EMPTY_CART, { action: 'add', variantId: first, quantity: 1 })).toBe(EMPTY_CART);
  });
});

describe('request schemas', () => {
  it('accepts a valid add and defaults quantity to 1', () => {
    const parsed = CartMutationSchema.parse({ action: 'add', variantId: 'abcdef12-3456-7890' });
    expect(parsed).toMatchObject({ action: 'add', quantity: 1 });
  });

  it('rejects bad variant ids and quantities', () => {
    expect(CartMutationSchema.safeParse({ action: 'add', variantId: '../etc', quantity: 1 }).success).toBe(false);
    expect(CartMutationSchema.safeParse({ action: 'set', variantId: 'abcdef12-3456', quantity: 500 }).success).toBe(false);
    expect(CartMutationSchema.safeParse({ action: 'nope', variantId: 'abcdef12-3456' }).success).toBe(false);
  });

  it('allows checking out the saved cart with an empty body', () => {
    expect(CheckoutRequestSchema.safeParse({}).success).toBe(true);
  });
});
