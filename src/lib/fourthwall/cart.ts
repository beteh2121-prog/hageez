import { CART_CURRENCY, EMPTY_CART, type CartLine, type CartView } from '@/lib/fourthwall/cart-types';

/**
 * Server-side client for Fourthwall's Storefront Cart API.
 * Endpoints verified against Fourthwall's OpenAPI spec
 * (docs.fourthwall.com/open-api-docs/storefront.json):
 *   POST /v1/carts               create (body: { items })
 *   GET  /v1/carts/{id}          read
 *   POST /v1/carts/{id}/add      add
 *   POST /v1/carts/{id}/change   set quantity
 *   POST /v1/carts/{id}/remove   remove
 */

const STOREFRONT_API_BASE = 'https://storefront-api.fourthwall.com/v1';

export class FourthwallCartError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Raw API shapes (only the fields we read) ─────────────────────────────
interface RawMoney {
  value?: number;
  currency?: string;
}

interface RawImage {
  url?: string;
  transformedUrl?: string;
}

interface RawCartItem {
  quantity?: number;
  variant?: {
    id?: string;
    name?: string;
    unitPrice?: RawMoney;
    attributes?: { description?: string };
    images?: RawImage[];
    stock?: { type?: string; inStock?: number };
    product?: { id?: string; name?: string; slug?: string };
  };
}

interface RawCart {
  id?: string;
  items?: RawCartItem[];
}

export interface CartRequestItem {
  variantId: string;
  quantity: number;
}

// ── Pure reshaping (unit-tested) ─────────────────────────────────────────
export function reshapeCart(raw: RawCart, fallbackCurrency: string = CART_CURRENCY): CartView {
  const lines: CartLine[] = [];

  for (const item of raw.items ?? []) {
    const variant = item.variant;
    if (!variant?.id) continue;

    const quantity = Math.max(0, Math.floor(item.quantity ?? 0));
    if (quantity === 0) continue;

    const image = variant.images?.[0];
    const stock = variant.stock;

    lines.push({
      variantId: variant.id,
      productId: variant.product?.id ?? '',
      productSlug: variant.product?.slug ?? '',
      productName: variant.product?.name ?? variant.name ?? 'Item',
      variantLabel: variant.attributes?.description ?? '',
      quantity,
      unitPriceCents: Math.round((variant.unitPrice?.value ?? 0) * 100),
      imageUrl: image?.transformedUrl || image?.url || null,
      stockLimit: stock?.type === 'LIMITED' ? stock.inStock ?? 0 : null,
    });
  }

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const firstItem = raw.items?.find((item) => item.variant?.unitPrice?.currency);

  return {
    id: raw.id ?? null,
    lines,
    totalQuantity,
    subtotalCents,
    currency: firstItem?.variant?.unitPrice?.currency ?? fallbackCurrency,
  };
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  CART_OFFER_NOT_AVAILABLE: 'Sorry, that item is no longer available.',
  CART_OFFER_NOT_PURCHASABLE_ERROR: 'Sorry, that item can’t be purchased right now.',
  CART_QUANTITY_TOO_HIGH: 'There isn’t enough stock for that quantity.',
  CART_ITEM_NOT_FOUND_FOR_SHOP_ERROR: 'That item could not be found in our shop.',
  OFFER_VARIANT_NOT_FOUND_ERROR: 'That option could not be found. Please refresh the page.',
  CART_NOT_FOUND: 'Your cart expired. Please add the item again.',
};

export function friendlyCartMessage(code: string): string {
  return FRIENDLY_MESSAGES[code] ?? 'Something went wrong with your cart. Please try again.';
}

// ── HTTP ─────────────────────────────────────────────────────────────────
function getToken(): string {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) {
    throw new FourthwallCartError(
      'Shop checkout is not configured yet.',
      503,
      'NOT_CONFIGURED'
    );
  }
  return token;
}

async function request(
  path: string,
  options: { method: 'GET' | 'POST'; currency: string; body?: unknown }
): Promise<RawCart> {
  const url = `${STOREFRONT_API_BASE}${path}?storefront_token=${encodeURIComponent(getToken())}&currency=${encodeURIComponent(options.currency)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers: { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
    });
  } catch {
    throw new FourthwallCartError('Could not reach the shop. Please try again.', 502, 'UNREACHABLE');
  }

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const code =
      typeof parsed === 'object' && parsed !== null && 'code' in parsed && typeof parsed.code === 'string'
        ? parsed.code
        : response.status === 404
          ? 'CART_NOT_FOUND'
          : 'UPSTREAM_ERROR';
    throw new FourthwallCartError(friendlyCartMessage(code), response.status, code);
  }

  return (parsed ?? {}) as RawCart;
}

export async function createCart(items: CartRequestItem[] = [], currency: string = CART_CURRENCY): Promise<CartView> {
  return reshapeCart(await request('/carts', { method: 'POST', currency, body: { items } }), currency);
}

/** Returns null when the cart no longer exists (expired / invalid id). */
export async function getCart(cartId: string, currency: string = CART_CURRENCY): Promise<CartView | null> {
  try {
    return reshapeCart(
      await request(`/carts/${encodeURIComponent(cartId)}`, { method: 'GET', currency }),
      currency
    );
  } catch (error) {
    if (error instanceof FourthwallCartError && error.code === 'CART_NOT_FOUND') return null;
    throw error;
  }
}

async function mutate(
  cartId: string,
  action: 'add' | 'change' | 'remove',
  items: CartRequestItem[],
  currency: string
): Promise<CartView> {
  return reshapeCart(
    await request(`/carts/${encodeURIComponent(cartId)}/${action}`, { method: 'POST', currency, body: { items } }),
    currency
  );
}

export function addToCart(cartId: string, items: CartRequestItem[], currency: string = CART_CURRENCY) {
  return mutate(cartId, 'add', items, currency);
}

export function changeCart(cartId: string, items: CartRequestItem[], currency: string = CART_CURRENCY) {
  return mutate(cartId, 'change', items, currency);
}

export function removeFromCart(cartId: string, items: CartRequestItem[], currency: string = CART_CURRENCY) {
  return mutate(cartId, 'remove', items, currency);
}

/**
 * Documented checkout entry point:
 *   https://{shop_domain}/cart/checkout?cartId={id}&currency={code}
 * (docs.fourthwall.com/storefront/checkout)
 */
export function buildCartCheckoutUrl(origin: string, cartId: string, currency: string = CART_CURRENCY): string {
  const params = new URLSearchParams({ cartId, currency });
  return `${origin}/cart/checkout?${params.toString()}`;
}

export { EMPTY_CART };
