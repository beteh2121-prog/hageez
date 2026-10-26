'use client';

import CartPanel from '@/components/cart/CartPanel';

/** Full-page version of the cart (the navbar opens the slide-over version). */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-serif text-3xl text-brown">My Cart</h1>
      <CartPanel variant="page" />
    </div>
  );
}
