'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/books', label: 'Books' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.itemCount());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 bg-brown/[0.92] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-serif text-xl font-bold text-gold">
          Ethiopian Orthodox Heritage
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'pb-1 text-sm transition-colors',
                  isActive ? 'border-b-2 border-gold text-cream' : 'text-cream/65 hover:text-cream'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative text-cream hover:text-gold" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-brown">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Link href="/account" className="text-sm text-cream hover:text-gold">
              Account
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-cream hover:text-gold">
              Login
            </Link>
          )}

          <button
            type="button"
            className="text-cream md:hidden"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 bg-brown p-6">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg text-gold">Menu</span>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close menu" className="text-cream">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <nav className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="text-cream/80 hover:text-cream"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 border-t border-cream/10 pt-4">
              <Link href="/cart" onClick={() => setDrawerOpen(false)} className="text-cream/80">
                Cart ({itemCount})
              </Link>
              {isAuthenticated ? (
                <Link href="/account" onClick={() => setDrawerOpen(false)} className="text-cream/80">
                  Account
                </Link>
              ) : (
                <Link href="/login" onClick={() => setDrawerOpen(false)} className="text-cream/80">
                  Login
                </Link>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
