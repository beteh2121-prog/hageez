'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import PriceTag from '@/components/shared/PriceTag';
import EmptyState from '@/components/shared/EmptyState';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const total = useCartStore((state) => state.total());

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
            </div>
            <input
              type="number"
              min={1}
              max={99}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
              className="w-16 rounded-brand border border-gold/30 px-2 py-1 text-center"
            />
            <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-gold/20 pt-4">
        <p className="font-serif text-xl text-brown">Total</p>
        <PriceTag cents={total} />
      </div>

      <p className="mt-2 text-sm text-charcoal/50">
        Each item completes checkout on its own Fourthwall product page — click into a product to buy it.
      </p>
    </div>
  );
}
