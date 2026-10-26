import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FourthwallCartError, buildCartCheckoutUrl, createCart, getCart } from '@/lib/fourthwall/cart';
import { CheckoutRequestSchema } from '@/lib/fourthwall/cart-schemas';
import type { CartErrorBody } from '@/lib/fourthwall/cart-types';
import { getCheckoutOrigin } from '@/lib/fourthwall/shop';
import { CART_COOKIE } from '@/lib/fourthwall/cart-cookie';

export const dynamic = 'force-dynamic';

function fail(message: string, code: string, status: number): NextResponse<CartErrorBody> {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * Returns the Fourthwall checkout URL.
 *  - With { variantId, quantity }: "Buy now" — a fresh one-item cart, so the
 *    shopper's saved cart is left untouched.
 *  - With no body: checks out the shopper's saved cart.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => ({}));
  const parsed = CheckoutRequestSchema.safeParse(body ?? {});
  if (!parsed.success) return fail('Invalid checkout request.', 'INVALID_REQUEST', 400);

  try {
    const origin = await getCheckoutOrigin();
    if (!origin) {
      return fail('Checkout is not configured yet. Please try again soon.', 'NOT_CONFIGURED', 503);
    }

    let cartId: string | null = null;
    let currency: string | undefined;

    if (parsed.data.variantId) {
      const cart = await createCart([{ variantId: parsed.data.variantId, quantity: parsed.data.quantity }]);
      cartId = cart.id;
      currency = cart.currency;
    } else {
      const savedId = cookies().get(CART_COOKIE)?.value;
      const cart = savedId ? await getCart(savedId) : null;
      if (!cart || cart.lines.length === 0) return fail('Your cart is empty.', 'EMPTY_CART', 400);
      cartId = cart.id;
      currency = cart.currency;
    }

    if (!cartId) return fail('Could not start checkout. Please try again.', 'UPSTREAM_ERROR', 502);

    return NextResponse.json({ checkoutUrl: buildCartCheckoutUrl(origin, cartId, currency) });
  } catch (error) {
    if (error instanceof FourthwallCartError) {
      const status = error.status === 503 || error.status === 502 ? error.status : 400;
      return fail(error.message, error.code, status);
    }
    console.error('Unexpected checkout error:', error);
    return fail('Could not start checkout. Please try again.', 'UNEXPECTED', 500);
  }
}
