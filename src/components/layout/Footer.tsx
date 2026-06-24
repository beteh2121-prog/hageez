'use client';

import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { toast } from 'sonner';

const QUICK_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/books', label: 'Books' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="bg-brown-dark px-6 py-10 text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl text-gold">Ethiopian Orthodox Heritage</p>
          <p className="mt-2 italic text-cream/50">Rooted in Faith. Crafted with Purpose.</p>
          <div className="mt-4 flex gap-4">
            <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">
              <Facebook className="h-5 w-5 text-cream/60 hover:text-cream" />
            </a>
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">
              <Instagram className="h-5 w-5 text-cream/60 hover:text-cream" />
            </a>
            <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noreferrer">
              <Youtube className="h-5 w-5 text-cream/60 hover:text-cream" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 font-serif text-sm uppercase tracking-wide text-cream/80">Quick Links</p>
          <ul className="flex flex-col gap-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream/60 hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-serif text-sm uppercase tracking-wide text-cream/80">Stay Connected</p>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              toast('Newsletter coming soon!');
            }}
          >
            <input
              type="email"
              required
              placeholder="Your email"
              className="w-full rounded-brand bg-cream/10 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button type="submit" className="rounded-brand bg-gold px-4 py-2 text-sm font-medium text-brown">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-cream/40">© {new Date().getFullYear()} Ethiopian Orthodox Heritage. All rights reserved.</p>
        <p className="text-[0.65rem] text-cream/40">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    </footer>
  );
}
