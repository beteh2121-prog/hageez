'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCart, useCartMutation, useCheckout } from '@/hooks/useCart';
import { CART_MAX_LINE_QUANTITY } from '@/lib/fourthwall/cart-types';
import PriceTag from '@/components/shared/PriceTag';
import EmptyState from '@/components/shared/EmptyState';

export default function CartPage() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const cartMutation = useCartMutation();
  const checkout = useCheckout();

  function updateQuantity(variantId: string, quantity: number) {
    cartMutation.mutate(
      { action: 'set', variantId, quantity },
      { onError: (error) => toast.error(error.message) }
    );
  }

  function removeLine(variantId: string) {
    cartMutation.mutate(
      { action: 'remove', variantId },
      { onError: (error) => toast.error(error.message) }
    );
  }

  function handleCheckout() {
    checkout.mutate({}, { onError: (error) => toast.error(error.message) });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl text-brown">Your Cart</h1>
        <div className="mt-10 flex justify-center text-gold" role="status" aria-label="Loading your cart">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !cart) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl text-brown">Your Cart</h1>
        <p className="mt-6 text-charcoal/70">We couldn&apos;t load your cart right now.</p>
        <button type="button" onClick={() => refetch()} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-3xl text-brown">Your Cart</h1>
        <div className="mt-8">
          <EmptyState message="Your cart is empty." />
        </div>
        <div className="mt-4 text-center">
          <Link href="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl text-brown">Your Cart</h1>

      <div className="mt-8 flex flex-col gap-4">
        {cart.lines.map((line) => {
          const maxQuantity = Math.min(CART_MAX_LINE_QUANTITY, line.stockLimit ?? CART_MAX_LINE_QUANTITY);
          const title = line.variantLabel ? `${line.productName} — ${line.variantLabel}` : line.productName;

          return (
            <div
              key={line.variantId}
              className="flex items-center gap-4 rounded-brand-md border border-gold/10 bg-white p-4"
            >
              {line.imageUrl && (
                <Image
                  src={line.imageUrl}
                  alt={line.productName}
                  width={64}
                  height={64}
                  className="rounded-brand object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="font-serif text-brown">{title}</p>
                <PriceTag cents={line.unitPriceCents} currency={cart.currency} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-brand border border-gold/30 text-charcoal hover:border-gold"
                  aria-label={`Decrease quantity of ${title}`}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-medium" aria-live="polite">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                  disabled={line.quantity >= maxQuantity}
                  className="flex h-8 w-8 items-center justify-center rounded-brand border border-gold/30 text-charcoal hover:border-gold disabled:opacity-40"
                  aria-label={`Increase quantity of ${title}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeLine(line.variantId)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 border-t border-gold/20 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-serif text-xl text-brown">Subtotal</p>
          <PriceTag cents={cart.subtotalCents} currency={cart.currency} />
        </div>
        <p className="mt-1 text-right text-xs text-charcoal/50">Shipping and taxes are calculated at checkout.</p>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkout.isPending || checkout.isSuccess}
          className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
        >
          {checkout.isPending || checkout.isSuccess ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Taking you to checkout…
            </>
          ) : (
            'Checkout'
          )}
        </button>
        <p className="mt-2 text-center text-xs text-charcoal/40">
          You&apos;ll complete payment on Fourthwall&apos;s secure checkout.
        </p>
      </div>
    </div>
  );
}
