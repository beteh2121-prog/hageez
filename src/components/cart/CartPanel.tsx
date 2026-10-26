'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCart, useCartMutation, useCheckout } from '@/hooks/useCart';
import { CART_MAX_LINE_QUANTITY } from '@/lib/fourthwall/cart-types';
import { productPath } from '@/lib/fourthwall/routes';
import { formatPriceWithCode } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';

interface CartPanelProps {
  /** "drawer" fills the slide-over and scrolls the list; "page" just flows. */
  variant: 'drawer' | 'page';
  /** Called when a shopper follows a link out of the cart (closes the drawer). */
  onNavigate?: () => void;
}

/** The cart contents: items, totals and checkout. Shared by the drawer and /cart. */
export default function CartPanel({ variant, onNavigate }: CartPanelProps) {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const cartMutation = useCartMutation();
  const checkout = useCheckout();
  const isDrawer = variant === 'drawer';

  function setQuantity(variantId: string, quantity: number) {
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

  if (isLoading) {
    return (
      <div className="mt-20 flex justify-center text-gold" role="status" aria-label="Loading your cart">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !cart) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <p className="text-charcoal/70">We couldn&apos;t load your cart right now.</p>
        <button type="button" onClick={() => refetch()} className="btn-primary">
          Try again
        </button>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mt-20 flex w-full flex-col items-center justify-center gap-6 text-center">
        <ShoppingBag className="h-16 w-16 text-gold/60" />
        <p className="font-serif text-2xl font-bold text-brown">Your cart is empty.</p>
        <Link href="/shop" onClick={onNavigate} className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', isDrawer && 'min-h-0 flex-1 justify-between')}>
      <ul className={cn('py-4', isDrawer && 'flex-grow overflow-auto')}>
        {cart.lines.map((line) => {
          const title = line.productName;
          const maxQuantity = Math.min(CART_MAX_LINE_QUANTITY, line.stockLimit ?? CART_MAX_LINE_QUANTITY);
          const linkHref = line.productSlug ? productPath(line.productSlug, cart.currency) : null;

          const details = (
            <div className="flex flex-1 flex-col text-base">
              <span className="leading-tight text-charcoal">{title}</span>
              {line.variantLabel && <p className="text-sm text-charcoal/50">{line.variantLabel}</p>}
            </div>
          );

          return (
            <li key={line.variantId} className="flex w-full flex-col border-b border-charcoal/15">
              <div className="relative flex w-full flex-row justify-between gap-3 px-1 py-4">
                <button
                  type="button"
                  onClick={() => removeLine(line.variantId)}
                  aria-label={`Remove ${title} from cart`}
                  className="absolute z-40 -ml-1 -mt-2 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal/60 text-white transition-colors hover:bg-crimson"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex min-w-0 flex-row gap-2">
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-md border border-charcoal/15 bg-cream-dark">
                    {line.imageUrl && (
                      <Image
                        src={line.imageUrl}
                        alt={title}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {linkHref ? (
                    <Link href={linkHref} onClick={onNavigate} className="z-30 ml-1 flex">
                      {details}
                    </Link>
                  ) : (
                    <div className="ml-1 flex">{details}</div>
                  )}
                </div>

                <div className="flex h-16 flex-none flex-col justify-between">
                  <p className="text-right text-sm text-charcoal">
                    {formatPriceWithCode(line.unitPriceCents * line.quantity, cart.currency)}
                  </p>
                  <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-charcoal/15 bg-white/60">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      aria-label={`Reduce quantity of ${title}`}
                      className="flex h-full w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    >
                      <Minus className="h-4 w-4 text-charcoal/60" />
                    </button>
                    <span className="w-6 text-center text-sm" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= maxQuantity}
                      aria-label={`Increase quantity of ${title}`}
                      className="flex h-full w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70 disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4 text-charcoal/60" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="py-4 text-sm text-charcoal/60">
        <div className="mb-3 flex items-center justify-between border-b border-charcoal/15 pb-1">
          <p>Taxes</p>
          <p className="text-right">Calculated at checkout</p>
        </div>
        <div className="mb-3 flex items-center justify-between border-b border-charcoal/15 pb-1 pt-1">
          <p>Shipping</p>
          <p className="text-right">Calculated at checkout</p>
        </div>
        <div className="mb-3 flex items-center justify-between border-b border-charcoal/15 pb-1 pt-1">
          <p>Total</p>
          <p className="text-right text-base text-charcoal">
            {formatPriceWithCode(cart.subtotalCents, cart.currency)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => checkout.mutate({}, { onError: (error) => toast.error(error.message) })}
        disabled={checkout.isPending || checkout.isSuccess}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gold p-3 text-center text-sm font-medium text-cream transition-colors hover:bg-gold-dark disabled:opacity-70"
      >
        {checkout.isPending || checkout.isSuccess ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Taking you to checkout…
          </>
        ) : (
          'Proceed to Checkout'
        )}
      </button>
    </div>
  );
}
