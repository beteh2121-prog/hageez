'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useCartDrawer } from '@/store/cartDrawerStore';
import CartPanel from '@/components/cart/CartPanel';

/** Slide-over "My Cart", opened from the navbar and after Add to Cart. */
export default function CartDrawer() {
  const { isOpen, close, setOpen } = useCartDrawer();

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-[60] flex h-full w-full flex-col border-l border-gold/20 bg-cream/90 p-6 text-charcoal shadow-2xl backdrop-blur-xl data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in md:w-[390px]"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-brown">My Cart</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close cart"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-charcoal/15 bg-white/60 text-charcoal transition-colors hover:border-gold"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <CartPanel variant="drawer" onNavigate={close} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
