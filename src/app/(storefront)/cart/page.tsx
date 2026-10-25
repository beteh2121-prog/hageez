'use client';

import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { buildFourthwallCheckoutUrl, getFourthwallStoreUrl } from '@/lib/fourthwall/checkout';
import PriceTag from '@/components/shared/PriceTag';
import EmptyState from '@/components/shared/EmptyState';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const total = useCartStore((state) => state.total());

  const checkoutItems = items.filter((item) => item.variant_id);
  const legacyItems = items.filter((item) => !item.variant_id);

  function handleCheckout() {
    const url = buildFourthwallCheckoutUrl(
      getFourthwallStoreUrl(),
      checkoutItems.map((item) => ({ variantId: item.variant_id as string, quantity: item.quantity }))
    );
    if (!url) {
      toast.error(
        checkoutItems.length === 0
          ? 'Nothing in your cart can be checked out yet.'
          : 'Checkout is not configured yet — the Fourthwall store URL is missing.'
      );
      return;
    }
    window.location.href = url;
  }

  if (items.length === 0) {
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
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-brand-md border border-gold/10 bg-white p-4">
            {item.image && (
              <Image src={item.image} alt={item.title} width={64} height={64} className="rounded-brand object-cover" />
            )}
            <div className="flex-1">
              <p className="font-serif text-brown">{item.title}</p>
              <PriceTag cents={item.price_cents} />
              {!item.variant_id && (
                <p className="mt-1 text-xs text-crimson">
                  Saved before an update — remove it and add it again from its product page.
                </p>
              )}
            </div>
            <input
              type="number"
              min={1}
              max={99}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
              className="w-16 rounded-brand border border-gold/30 px-2 py-1 text-center text-sm"
              aria-label={`Quantity for ${item.title}`}
            />
            <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-gold/20 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-serif text-xl text-brown">Total</p>
          <PriceTag cents={total} />
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkoutItems.length === 0}
          className="btn-primary mt-4 w-full disabled:opacity-50"
        >
          Checkout
        </button>
        {legacyItems.length > 0 && (
          <p className="mt-2 text-center text-xs text-charcoal/50">
            {legacyItems.length} item(s) above will be left out of checkout until re-added.
          </p>
        )}
        <p className="mt-2 text-center text-xs text-charcoal/40">
          You&apos;ll complete payment on Fourthwall&apos;s secure checkout.
        </p>
      </div>
    </div>
  );
}
