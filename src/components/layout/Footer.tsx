import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import NewsletterForm from '@/components/shared/NewsletterForm';
import type { FooterSettings, SiteSettings, SitePage } from '@/lib/supabase/settings';

interface FooterProps {
  siteSettings: SiteSettings;
  footerSettings: FooterSettings;
  extraPages: SitePage[];
}

export default function Footer({ siteSettings, footerSettings, extraPages }: FooterProps) {
  const navPages = extraPages.filter((p) => p.show_in_nav);

  return (
    <footer className="bg-brown-dark text-cream">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <p className="font-serif text-xl text-gold">
              {siteSettings.logo_icon} {siteSettings.logo_text}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/45">
              {footerSettings.tagline}
            </p>
            <div className="mt-5 flex gap-4">
              {footerSettings.facebook_url && (
                <a href={footerSettings.facebook_url} aria-label="Facebook" target="_blank" rel="noreferrer">
                  <Facebook className="h-4 w-4 text-cream/40 transition-colors hover:text-gold" />
                </a>
              )}
              {footerSettings.instagram_url && (
                <a href={footerSettings.instagram_url} aria-label="Instagram" target="_blank" rel="noreferrer">
                  <Instagram className="h-4 w-4 text-cream/40 transition-colors hover:text-gold" />
                </a>
              )}
              {footerSettings.youtube_url && (
                <a href={footerSettings.youtube_url} aria-label="YouTube" target="_blank" rel="noreferrer">
                  <Youtube className="h-4 w-4 text-cream/40 transition-colors hover:text-gold" />
                </a>
              )}
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
                { href: '/about', label: 'About' },
                ...navPages.map((p) => ({ href: `/pages/${p.slug}`, label: p.title })),
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-cream/50 transition-colors hover:text-cream"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[2px] text-cream/30">Stay Connected</p>
            <p className="mb-4 text-sm text-cream/45">
              New books, free resources, and spiritual content — in your inbox.
            </p>
            <NewsletterForm />
            {footerSettings.support_email && (
              <p className="mt-4 text-xs text-cream/30">
                Support:{' '}
                <a href={`mailto:${footerSettings.support_email}`} className="hover:text-gold">
                  {footerSettings.support_email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-cream/30">
            © {new Date().getFullYear()} {siteSettings.name}. All rights reserved.
          </p>
          <p className="text-[0.65rem] text-cream/25">
            As an Amazon Associate I earn from qualifying purchases.
          </p>
        </div>
      </div>
    </footer>
  );
}
