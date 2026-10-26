import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  FourthwallCartError,
  addToCart,
  changeCart,
  createCart,
  getCart,
  removeFromCart,
} from '@/lib/fourthwall/cart';
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from '@/lib/fourthwall/cart-cookie';
import { normalizeStoreCurrency } from '@/lib/fourthwall/routes';
import { CartMutationSchema, type CartMutationInput } from '@/lib/fourthwall/cart-schemas';
import {
  CART_MAX_LINE_QUANTITY,
  emptyCartFor,
  type CartErrorBody,
  type CartView,
} from '@/lib/fourthwall/cart-types';

export const dynamic = 'force-dynamic';

function withCartCookie(response: NextResponse, cart: CartView): NextResponse {
  if (cart.id) {
    response.cookies.set(CART_COOKIE, cart.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: CART_COOKIE_MAX_AGE,
    });
  }
  return response;
}

function clearCartCookie(response: NextResponse): NextResponse {
  response.cookies.set(CART_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}

function errorResponse(error: unknown): NextResponse<CartErrorBody> {
  if (error instanceof FourthwallCartError) {
    const status = error.status === 503 || error.status === 502 ? error.status : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  console.error('Unexpected cart error:', error);
  return NextResponse.json(
    { error: 'Something went wrong with your cart. Please try again.', code: 'UNEXPECTED' },
    { status: 500 }
  );
}

function currencyOf(request: Request): string {
  return normalizeStoreCurrency(new URL(request.url).searchParams.get('currency'));
}

async function loadOrCreateCart(cartId: string | undefined, currency: string): Promise<CartView> {
  if (cartId) {
    const existing = await getCart(cartId, currency);
    if (existing) return existing;
  }
  return createCart([], currency);
}

async function applyMutation(
  cartId: string | undefined,
  mutation: CartMutationInput,
  currency: string
): Promise<CartView> {
  const cart = await loadOrCreateCart(cartId, currency);
  const id = cart.id;
  if (!id) {
    throw new FourthwallCartError('Could not start a cart. Please try again.', 502, 'UPSTREAM_ERROR');
  }

  const line = cart.lines.find((l) => l.variantId === mutation.variantId);

  switch (mutation.action) {
    case 'add': {
      const room = CART_MAX_LINE_QUANTITY - (line?.quantity ?? 0);
      const delta = Math.min(mutation.quantity, room);
      if (delta <= 0) return cart;
      return addToCart(id, [{ variantId: mutation.variantId, quantity: delta }], currency);
    }
    case 'set': {
      if (mutation.quantity === 0) {
        if (!line) return cart;
        return removeFromCart(id, [{ variantId: line.variantId, quantity: line.quantity }], currency);
      }
      if (!line) return addToCart(id, [{ variantId: mutation.variantId, quantity: mutation.quantity }], currency);
      if (line.quantity === mutation.quantity) return cart;
      return changeCart(id, [{ variantId: mutation.variantId, quantity: mutation.quantity }], currency);
    }
    case 'remove': {
      if (!line) return cart;
      return removeFromCart(id, [{ variantId: line.variantId, quantity: line.quantity }], currency);
    }
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const currency = currencyOf(request);
  const cartId = cookies().get(CART_COOKIE)?.value;
  if (!cartId) return NextResponse.json(emptyCartFor(currency));

  try {
    const cart = await getCart(cartId, currency);
    if (!cart) return clearCartCookie(NextResponse.json(emptyCartFor(currency)));
    return NextResponse.json(cart);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = CartMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<CartErrorBody>(
      { error: 'Invalid cart request.', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }

  try {
    const cart = await applyMutation(cookies().get(CART_COOKIE)?.value, parsed.data, currencyOf(request));
    return withCartCookie(NextResponse.json(cart), cart);
  } catch (error) {
    return errorResponse(error);
  }
}

/** Empties the browser's cart (used on sign-out). The Fourthwall cart simply expires. */
export async function DELETE(request: Request): Promise<NextResponse> {
  return clearCartCookie(NextResponse.json(emptyCartFor(currencyOf(request))));
}
