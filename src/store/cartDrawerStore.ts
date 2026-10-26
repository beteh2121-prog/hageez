import { create } from 'zustand';

/** Whether the slide-over cart is open. UI state only — the cart itself lives on Fourthwall. */
interface CartDrawerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (isOpen: boolean) => void;
}

export const useCartDrawer = create<CartDrawerState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setOpen: (isOpen) => set({ isOpen }),
}));
