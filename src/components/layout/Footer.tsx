'use client';

import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { toast } from 'sonner';

export default function Footer() {
  return (
    <footer className="bg-brown-dark text-cream">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <p className="font-serif text-xl text-gold">✝ Ethiopian Orthodox Heritage</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/45">
              A curated marketplace dedicated to Ethiopian Orthodox Tewahedo literature, theology, crafts, and cultural resources — for the faithful everywhere.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">
                <Facebook className="h-4 w-4 text-cream/40 hover:text-gold transition-colors" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram className="h-4 w-4 text-cream/40 hover:text-gold transition-colors" />
              </a>
              <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noreferrer">
                <Youtube className="h-4 w-4 text-cream/40 hover:text-gold transition-colors" />
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[2px] text-cream/30">Explore</p>
            <div className="flex flex-col gap-3">
              {[
                { href: '/books', label: 'Books' },
                { href: '/ebooks', label: 'Ebooks' },
                { href: '/shop', label: 'Merch' },
                { href: '/downloads', label: 'Downloads' },
                { href: '/blog', label: 'Blog' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-cream/50 hover:text-cream transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[2px] text-cream/30">Stay Connected</p>
            <p className="mb-4 text-sm text-cream/45">New books, free resources, and spiritual content — in your inbox.</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); toast.success('Newsletter coming soon!'); }}>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full rounded-[2px] bg-white/8 px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:ring-1 focus:ring-gold border border-white/10"
              />
              <button type="submit" className="rounded-[2px] bg-gold px-4 py-2 text-sm font-medium text-brown-dark hover:bg-gold-dark transition-colors">
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-cream/30">© {new Date().getFullYear()} Ethiopian Orthodox Heritage. All rights reserved.</p>
          <p className="text-[0.65rem] text-cream/25">As an Amazon Associate I earn from qualifying purchases.</p>
        </div>
      </div>
    </footer>
  );
}
