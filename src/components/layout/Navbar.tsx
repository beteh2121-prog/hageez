'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useCartDrawer } from '@/store/cartDrawerStore';
import CartDrawer from '@/components/cart/CartDrawer';
import CurrencySelector from '@/components/layout/CurrencySelector';
import { cn } from '@/lib/utils/cn';
import type { SiteSettings, SitePage } from '@/lib/supabase/settings';

const CORE_NAV = [
  { href: '/books', label: 'Books' },
  { href: '/ebooks', label: 'Ebooks' },
  { href: '/shop', label: 'Merch' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/blog', label: 'Blog' },
];

interface NavbarProps {
  siteSettings: SiteSettings;
  extraPages: SitePage[];
}

export default function Navbar({ siteSettings, extraPages }: NavbarProps) {
  const pathname = usePathname();
  const { data: cart } = useCart();
  const itemCount = cart?.totalQuantity ?? 0;
  const openCart = useCartDrawer((state) => state.open);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setIsAuthenticated(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      setIsAuthenticated(!!session)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const navPages = extraPages
    .filter((p) => p.show_in_nav)
    .map((p) => ({ href: `/pages/${p.slug}`, label: p.title }));

  const allNavLinks = [...CORE_NAV, ...navPages];

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/5 bg-brown-dark/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-gold">
          <span className="text-xl">{siteSettings.logo_icon}</span>
          <span className="hidden sm:block">{siteSettings.logo_text}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {allNavLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'pb-1 text-sm transition-colors',
                  isActive ? 'border-b-2 border-gold text-cream' : 'text-cream/60 hover:text-cream'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <CurrencySelector />
          <button
            type="button"
            onClick={openCart}
            className="relative text-cream/70 hover:text-gold"
            aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-semibold text-brown-dark">
                {itemCount}
              </span>
            )}
          </button>
          {isAuthenticated ? (
            <Link href="/account" className="hidden text-sm text-cream/60 hover:text-cream md:block">
              Account
            </Link>
          ) : (
            <Link href="/login" className="hidden text-sm text-cream/60 hover:text-cream md:block">
              Sign in
            </Link>
          )}
          <Link href="/shop" className="hidden btn-primary md:inline-flex">
            Get Started
          </Link>
          <button
            type="button"
            className="text-cream/70 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 bg-brown-dark p-6">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg text-gold">
                {siteSettings.logo_icon} Menu
              </span>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close" className="text-cream/60">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <nav className="flex flex-col gap-4">
              {allNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="text-cream/70 hover:text-cream"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  openCart();
                }}
                className="text-left text-cream/60"
              >
                Cart ({itemCount})
              </button>
              {isAuthenticated ? (
                <Link href="/account" onClick={() => setDrawerOpen(false)} className="text-cream/60">
                  Account
                </Link>
              ) : (
                <Link href="/login" onClick={() => setDrawerOpen(false)} className="text-cream/60">
                  Sign in
                </Link>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CartDrawer />
    </header>
  );
}
