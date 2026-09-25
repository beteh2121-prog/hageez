import Link from 'next/link';
import { ArrowRight, BookOpen, Download, ShoppingBag } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import { getAllSettings } from '@/lib/supabase/settings';
import NewsletterForm from '@/components/shared/NewsletterForm';
import BookCard from '@/features/books/components/BookCard';
import MerchCard from '@/features/merch/components/MerchCard';
import type { Merch, KdpBook } from '@/types';

export const revalidate = 300;

const CATEGORY_SHORTCUTS = [
  { icon: BookOpen, label: 'Physical Books', sub: 'via Amazon KDP', href: '/books' },
  { icon: Download, label: 'eBooks', sub: 'Instant delivery', href: '/ebooks' },
  { icon: Download, label: 'Free Downloads', sub: 'Prayers & guides', href: '/downloads' },
  { icon: ShoppingBag, label: 'Orthodox Merch', sub: 'Print on demand', href: '/shop' },
];

const MISSION_ITEMS = [
  { icon: '📖', title: 'Theology', desc: 'Deep dives into Ethiopian Orthodox doctrine' },
  { icon: '✝️', title: 'Liturgy', desc: 'Sacred texts and worship guides' },
  { icon: '🕊️', title: 'Saints', desc: 'Lives of Ethiopian saints and martyrs' },
  { icon: '🇪🇹', title: 'Heritage', desc: 'History and culture of the faith' },
];

async function getHomeData() {
  const supabase = createStaticClient();
  const [{ data: merch }, { data: books }] = await Promise.all([
    supabase.from('merch').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
    supabase.from('kdp_books').select('*').eq('is_published', true).eq('is_featured', true).limit(4),
  ]);
  return {
    merch: (merch ?? []) as Merch[],
    books: (books ?? []) as KdpBook[],
  };
}

export default async function HomePage() {
  const [{ merch, books }, settings] = await Promise.all([getHomeData(), getAllSettings()]);
  const { hero, stats } = settings;
  const titleParts = hero.title.split('Faith');

  return (
    <div className="flex flex-col">
      <section className="relative min-h-[85vh] overflow-hidden bg-gradient-to-br from-brown-dark via-brown-dark to-crimson-dark/60">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <div>
            <span className="mb-4 block text-xs uppercase tracking-[0.3em] text-gold">{hero.tagline}</span>
            <h1 className="font-serif text-5xl font-bold leading-[1.1] text-cream md:text-6xl">
              {titleParts.length > 1 ? (
                <>
                  {titleParts[0]}
                  <br />
                  <span className="text-gold">Faith{titleParts[1]}</span>
                </>
              ) : (
                hero.title
              )}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/70">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero.cta_primary_href} className="btn-primary gap-2 px-7 py-3 text-base">
                {hero.cta_primary_text} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={hero.cta_secondary_href}
                className="inline-flex items-center justify-center gap-2 rounded-brand border border-gold/50 px-7 py-3 text-base text-cream transition-colors hover:bg-gold/10 hover:border-gold"
              >
                {hero.cta_secondary_text}
              </Link>
            </div>

            {stats.length > 0 && (
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
                {stats.slice(0, 3).map((stat) => (
                  <div key={stat.label}>
                    <div className="font-serif text-2xl font-bold text-gold">{stat.num}</div>
                    <div className="mt-0.5 text-xs text-cream/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="relative h-72 w-72">
              <div className="absolute inset-0 rounded-full bg-gold/20 blur-3xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-gold/20 bg-gradient-to-br from-gold/30 to-crimson/30">
                <div className="text-center">
                  <span className="block font-ethiopic text-6xl text-gold">✝</span>
                  <span className="mt-2 block font-ethiopic text-xl text-gold/70">ሥዕለ ቤት</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-dark/40 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {CATEGORY_SHORTCUTS.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group rounded-brand-md border border-gold/10 bg-white p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-gold-md"
              >
                <cat.icon className="mx-auto mb-3 h-8 w-8 text-gold transition-transform group-hover:scale-110" />
                <div className="font-serif text-sm font-semibold text-brown">{cat.label}</div>
                <div className="mt-0.5 text-xs text-charcoal/50">{cat.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gold">Curated Collection</span>
            <h2 className="font-serif text-3xl font-bold text-brown md:text-4xl">Featured Books</h2>
          </div>
          <Link href="/books" className="mb-2 flex shrink-0 items-center gap-1 text-sm text-gold hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {books.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {books.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        ) : (
          <div className="py-16 text-center text-charcoal/40">
            <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p>Books coming soon. Check back later!</p>
          </div>
        )}
      </section>

      <section className="bg-gold py-16 text-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-cream/70">Our Mission</span>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">Preserving Ancient Wisdom</h2>
            <p className="mt-4 leading-relaxed text-cream/85">
              Ethiopian Orthodox Heritage is dedicated to making Tewahedo theology, history, liturgy, and
              literature accessible to the global Orthodox community and curious seekers worldwide.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 rounded-brand border border-cream/40 px-6 py-2.5 text-sm transition-colors hover:bg-cream/10"
            >
              Learn More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {MISSION_ITEMS.map((item) => (
              <div key={item.title} className="rounded-brand-md bg-cream/10 p-4">
                <span className="mb-2 block text-2xl">{item.icon}</span>
                <div className="font-serif text-sm font-semibold">{item.title}</div>
                <div className="mt-1 text-xs text-cream/70">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gold">Print on Demand</span>
            <h2 className="font-serif text-3xl font-bold text-brown md:text-4xl">Orthodox Merch</h2>
            <p className="mt-2 text-sm text-charcoal/55">Faith-inspired apparel and accessories, fulfilled by Fourthwall.</p>
          </div>
          <Link href="/shop" className="mb-2 flex shrink-0 items-center gap-1 text-sm text-gold hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {merch.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {merch.map((product) => <MerchCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="py-16 text-center text-charcoal/40">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <p>Merch coming soon!</p>
          </div>
        )}
      </section>

      <section className="bg-cream-dark/60 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <span className="text-xs uppercase tracking-widest text-gold">Stay Connected</span>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brown md:text-4xl">Join Our Community</h2>
          <p className="mt-3 text-charcoal/60">
            New book releases, free resources, and spiritual reflections delivered to your inbox.
          </p>
          <div className="mt-8 flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
