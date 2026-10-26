'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CART_MAX_LINE_QUANTITY,
  EMPTY_CART,
  type CartErrorBody,
  type CartMutation,
  type CartView,
} from '@/lib/fourthwall/cart-types';

export const CART_QUERY_KEY = ['cart'] as const;

export class CartRequestError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = (data ?? {}) as Partial<CartErrorBody>;
    throw new CartRequestError(
      body.error ?? 'Something went wrong with your cart. Please try again.',
      body.code ?? 'UNKNOWN'
    );
  }
  return data as T;
}

async function fetchCart(): Promise<CartView> {
  return parseResponse<CartView>(await fetch('/api/cart', { cache: 'no-store' }));
}

/** Instant UI feedback for quantity changes / removals; the server reply replaces it. */
export function applyOptimistic(cart: CartView, mutation: CartMutation): CartView {
  if (mutation.action === 'add') return cart;

  const lines =
    mutation.action === 'remove' || mutation.quantity === 0
      ? cart.lines.filter((line) => line.variantId !== mutation.variantId)
      : cart.lines.map((line) =>
          line.variantId === mutation.variantId
            ? { ...line, quantity: Math.min(CART_MAX_LINE_QUANTITY, mutation.quantity) }
            : line
        );

  return {
    ...cart,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0),
  };
}

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: fetchCart,
    staleTime: 15_000,
  });
}

export function useCartMutation() {
  const queryClient = useQueryClient();

  return useMutation<CartView, CartRequestError, CartMutation, { previous: CartView | undefined }>({
    mutationFn: async (mutation) =>
      parseResponse<CartView>(
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation),
        })
      ),
    onMutate: async (mutation) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartView>(CART_QUERY_KEY);
      if (previous) queryClient.setQueryData(CART_QUERY_KEY, applyOptimistic(previous, mutation));
      return { previous };
    },
    onError: (_error, _mutation, context) => {
      if (context?.previous) queryClient.setQueryData(CART_QUERY_KEY, context.previous);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

interface CheckoutVariables {
  /** Omit to check out the saved cart; pass for a one-item "Buy now". */
  variantId?: string;
  quantity?: number;
}

export function useCheckout() {
  return useMutation<string, CartRequestError, CheckoutVariables>({
    mutationFn: async (variables) => {
      const data = await parseResponse<{ checkoutUrl: string }>(
        await fetch('/api/cart/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variables),
        })
      );
      return data.checkoutUrl;
    },
    onSuccess: (checkoutUrl) => {
      window.location.href = checkoutUrl;
    },
  });
}

/** Clears the saved cart (called on sign-out). */
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation<CartView, CartRequestError, void>({
    mutationFn: async () => parseResponse<CartView>(await fetch('/api/cart', { method: 'DELETE' })),
    onSuccess: () => {
      queryClient.setQueryData(CART_QUERY_KEY, EMPTY_CART);
    },
  });
}
