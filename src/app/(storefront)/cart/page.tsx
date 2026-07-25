'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import PriceTag from '@/components/shared/PriceTag';
import EmptyState from '@/components/shared/EmptyState';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const total = useCartStore((state) => state.total());
  const [checkingOut, setCheckingOut] = useState(false);

  async function handleCheckout() {
    // Only merch items can go through Fourthwall checkout.
    // Download items go through their own delivery flow.
    const merchItems = items.filter((i) => i.type === 'merch');

    if (merchItems.length === 0) {
      toast.error('No purchasable items in cart. Visit each download page to buy individually.');
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: merchItems.map((item) => ({
            fourthwall_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await res.json()) as { checkoutUrl?: string; error?: string };

      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error ?? 'Could not start checkout');
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      toast.error('Could not reach checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
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
          <div key={item.id} className="flex items-center gap-4 rounded-brand-md border border-gold/10 p-4">
            {item.image && (
              <Image
                src={item.image}
                alt={item.title}
                width={64}
                height={64}
                className="rounded-brand object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-serif text-brown">{item.title}</p>
              <PriceTag cents={item.price_cents} />
              {item.type === 'download' && (
                <p className="mt-1 text-xs text-charcoal/50">Visit the download page to purchase</p>
              )}
            </div>
            {item.type === 'merch' && (
              <input
                type="number"
                min={1}
                max={99}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                className="w-16 rounded-brand border border-gold/30 px-2 py-1 text-center text-sm"
              />
            )}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-600 hover:underline"
            >
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
          disabled={checkingOut}
          className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
        >
          {checkingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading checkout…
            </>
          ) : (
            'Checkout'
          )}
        </button>
        <p className="mt-2 text-center text-xs text-charcoal/40">
          Secure checkout powered by Fourthwall
        </p>
      </div>
    </div>
  );
}
