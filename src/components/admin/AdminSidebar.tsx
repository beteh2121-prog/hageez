'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Download,
  BookOpen,
  ShoppingBag,
  TrendingUp,
  Settings,
  LogOut,
  PenSquare,
  FileText,
  Palette,
} from 'lucide-react';
import { useSignOut } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/downloads', label: 'Downloads', icon: Download },
  { href: '/admin/books', label: 'Books', icon: BookOpen },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/affiliate', label: 'Affiliate', icon: TrendingUp },
  {
    href: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'https://ethiopianorthodoxheritage.sanity.studio',
    label: 'Blog (Studio)',
    icon: PenSquare,
    isExternal: true,
  },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/site-settings', label: 'Site Settings', icon: Palette },
  { href: '/admin/settings', label: 'Account', icon: Settings },
];

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const signOut = useSignOut();

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-brown-dark text-cream">
      <div className="px-6 py-6">
        <p className="font-serif text-lg text-gold">Admin</p>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isExternal = 'isExternal' in item && item.isExternal;
          const isActive = !isExternal && pathname.startsWith(item.href);
          const Icon = item.icon;

          if (isExternal) {
            return (
              
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-brand border-l-[3px] border-transparent px-3 py-2 text-sm text-cream/60 transition-colors hover:text-cream"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-brand border-l-[3px] px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-gold bg-white/5 text-gold'
                  : 'border-transparent text-cream/60 hover:text-cream'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-white/10 px-4 py-4">
        <p className="truncate text-xs text-cream/50">{email}</p>
        <button
          type="button"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
          className="flex items-center gap-2 text-sm text-cream/70 hover:text-cream disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {signOut.isPending ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
