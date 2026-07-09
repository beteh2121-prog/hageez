'use client';

import { useState } from 'react';
import { ShoppingBag, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import type { Merch } from '@/types';

interface AddToCartButtonProps {
  product: Merch;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [added, setAdded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const inCart = items.some((i) => i.id === product.id);

  function handleAddToCart() {
    addItem({
      id: product.id,
      fourthwall_id: product.fourthwall_id,
      title: product.title,
      price_cents: product.price_cents,
      quantity: 1,
      image: product.images[0]?.url,
      type: 'merch',
    });
    setAdded(true);
    toast.success(product.title + ' added to cart');
    setTimeout(() => setAdded(false), 2000);
  }

  async function handleBuyNow() {
    if (!product.fourthwall_id) {
      toast.error('This product cannot be purchased directly.');
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ fourthwall_id: product.fourthwall_id, quantity: 1 }],
        }),
      });

      const data = await res.json();

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleAddToCart}
        className="btn-secondary inline-flex items-center justify-center gap-2"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" />
            Added
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            {inCart ? 'Add Another' : 'Add to Cart'}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={checkingOut}
        className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {checkingOut ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading checkout…
          </>
        ) : (
          'Buy Now'
        )}
      </button>
    </div>
  );
}
