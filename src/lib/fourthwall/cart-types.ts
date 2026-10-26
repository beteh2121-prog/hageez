/**
 * Cart shapes shared by the server (/api/cart) and the browser (useCart).
 * No server-only imports here, so client components can use them safely.
 */

export const CART_CURRENCY = 'USD';
export const CART_MAX_LINE_QUANTITY = 99;

export interface CartLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  /** e.g. "Black, L". Empty when the product has a single default variant. */
  variantLabel: string;
  quantity: number;
  unitPriceCents: number;
  imageUrl: string | null;
  /** null = unlimited stock */
  stockLimit: number | null;
}

export interface CartView {
  id: string | null;
  lines: CartLine[];
  totalQuantity: number;
  subtotalCents: number;
  currency: string;
}

export const EMPTY_CART: CartView = {
  id: null,
  lines: [],
  totalQuantity: 0,
  subtotalCents: 0,
  currency: CART_CURRENCY,
};

export type CartMutation =
  | { action: 'add'; variantId: string; quantity: number }
  | { action: 'set'; variantId: string; quantity: number }
  | { action: 'remove'; variantId: string };

export interface CartErrorBody {
  error: string;
  code: string;
}
