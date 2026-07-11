import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Download, Package, Star } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import type { Merch, KdpBook, Download as DownloadType } from '@/types';

export const revalidate = 3600;

async function getHomeData() {
  const supabase = createStaticClient();

  const [{ data: merch }, { data: books }, { data: freeDownloads }] = await Promise.all([
    supabase.from('merch').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(3),
    supabase.from('kdp_books').select('*').eq('is_published', true).eq('is_featured', true).limit(4),
    supabase.from('downloads').select('*').eq('price_cents', 0).order('created_at', { ascending: false }).limit(2),
  ]);

  return {
    merch: (merch ?? []) as Merch[],
    books: (books ?? []) as KdpBook[],
    freeDownloads: (freeDownloads ?? []) as DownloadType[],
  };
}

export default async function HomePage() {
  const { merch, books, freeDownloads } = await getHomeData();

  return (
    <div className="flex flex-col">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brown-dark px-6 py-20 md:py-28">
        {/* Cross watermark */}
        <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none font-serif text-[320px] leading-none text-gold/[0.05]">
          ✝
        </div>
        <div className="relative mx-auto max-w-7xl">
          <span className="mb-5 inline-block rounded-[2px] border border-gold/30 px-3 py-1 text-[11px] uppercase tracking-[2px] text-gold">
            Ethiopian Orthodox Tewahedo
          </span>
          <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[1.15] text-cream sm:text-5xl lg:text-6xl">
            Rooted in{' '}
            <span className="text-gold">Faith</span>,{' '}
            Crafted with Purpose
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/60">
            A curated marketplace of books, ebooks, merch, and spiritual resources — dedicated to Ethiopian Orthodox Tewahedo literature, theology, and culture.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/books" className="btn-primary gap-2 px-7 py-3 text-base">
              Browse Books <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/downloads" className="btn-outline px-7 py-3 text-base" style={{ background:'transparent', border:'1px solid rgba(250,244,232,0.25)', color:'#FAF4E8' }}>
              Free Downloads
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <div className="bg-gold">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-brown/20 md:grid-cols-4">
          {[
            { num: '240+', label: 'Books & Ebooks' },
            { num: '18', label: 'Free Downloads' },
            { num: '4.9★', label: 'Avg. Rating' },
            { num: '12k+', label: 'Readers' },
          ].map((stat) => (
            <div key={stat.label} className="py-5 text-center">
              <div className="font-serif text-2xl font-medium text-brown-dark">{stat.num}</div>
              <div className="mt-0.5 text-xs text-brown/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED BOOKS ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-brown">Featured Books</h2>
            <p className="mt-1 text-sm text-charcoal/50">Curated KDP titles on Amazon</p>
          </div>
          <Link href="/books" className="flex items-center gap-1 text-sm text-gold hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {books.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {books.map((book, i) => (
              <Link key={book.id} href={`/books/${book.asin}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] bg-brown shadow-gold-sm transition-shadow group-hover:shadow-gold-md">
                  {book.cover_image_url ? (
                    <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">📖</div>
                  )}
                  {i === 0 && (
                    <span className="absolute right-2 top-2 rounded-[2px] bg-gold px-2 py-0.5 text-[10px] font-medium text-brown-dark">
                      Bestseller
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="font-serif text-sm font-medium leading-snug text-brown line-clamp-2">{book.title}</h3>
                  <p className="mt-1 text-xs text-charcoal/50">{book.author}</p>
                  <p className="mt-1 text-sm text-gold font-medium">{book.price_usd ? `$${book.price_usd.toFixed(2)}` : 'On Amazon'}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {['The Fetha Negest', 'Liturgy of St. Yared', 'Kebra Nagast', 'Andemta Commentary'].map((title, i) => (
              <Link key={title} href="/books" className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] shadow-gold-sm transition-shadow group-hover:shadow-gold-md" style={{ background: ['linear-gradient(145deg,#3D1F0D,#6B3A1F)', 'linear-gradient(145deg,#1C1410,#3D1F0D)', 'linear-gradient(145deg,#6B3A1F,#C9922A)', 'linear-gradient(145deg,#0F2B1E,#1D5E3A)'][i] }}>
                  <div className="flex h-full items-center justify-center text-5xl">{'📖✝️🕊️🌿'[i]}</div>
                  {i === 0 && <span className="absolute right-2 top-2 rounded-[2px] bg-gold px-2 py-0.5 text-[10px] font-medium text-brown-dark">Bestseller</span>}
                </div>
                <div className="mt-3">
                  <h3 className="font-serif text-sm font-medium leading-snug text-brown">{title}</h3>
                  <p className="mt-1 text-xs text-charcoal/50">Traditional</p>
                  <p className="mt-1 text-sm text-gold font-medium">On Amazon</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="gold-divider mx-6" />

      {/* ── FEATURED MERCH ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-brown">New Merch</h2>
            <p className="mt-1 text-sm text-charcoal/50">Print-on-demand via Fourthwall</p>
          </div>
          <Link href="/shop" className="flex items-center gap-1 text-sm text-gold hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {merch.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {merch.slice(0, 3).map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow">
                <div className="relative aspect-square overflow-hidden bg-cream-dark">
                  {product.images[0] ? (
                    <Image src={product.images[0].url} alt={product.images[0].alt} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">✝️</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-medium text-brown">{product.title}</h3>
                  <p className="mt-1 text-sm text-gold font-medium">${(product.price_cents / 100).toFixed(2)}</p>
                  <span className="btn-dark mt-3 w-full text-sm">Add to Cart</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[{ emoji:'✝️', bg:'#FAF4E8', name:'Ethiopian Cross Tee', price:'$32.00' }, { emoji:'🕍', bg:'#F0E4CC', name:'Lalibela Art Print', price:'$28.00' }, { emoji:'📿', bg:'#1C0D06', name:'Prayer Beads Mug', price:'$19.00' }].map((item) => (
              <Link key={item.name} href="/shop" className="group overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow">
                <div className="flex aspect-square items-center justify-center text-6xl" style={{ background: item.bg }}>{item.emoji}</div>
                <div className="p-4">
                  <h3 className="font-serif text-base font-medium text-brown">{item.name}</h3>
                  <p className="mt-1 text-sm text-gold font-medium">{item.price}</p>
                  <span className="btn-dark mt-3 block w-full text-center text-sm">Add to Cart</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── TESTIMONIAL ────────────────────────────────────────── */}
      <div className="bg-brown px-6 py-14 text-center">
        <p className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed text-cream/90 md:text-2xl">
          &ldquo;This is the most complete collection of Ethiopian Orthodox spiritual resources I have found outside of Ethiopia itself.&rdquo;
        </p>
        <p className="mt-4 text-sm text-gold">— Reader, Addis Ababa</p>
      </div>

      {/* ── FREE DOWNLOADS ─────────────────────────────────────── */}
      <section className="bg-cream-dark/50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl text-brown">Free Downloads</h2>
              <p className="mt-1 text-sm text-charcoal/50">Liturgical texts, prayers, and guides — no cost</p>
            </div>
            <Link href="/downloads" className="flex items-center gap-1 text-sm text-gold hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {freeDownloads.length > 0 ? freeDownloads.map((dl) => (
              <Link key={dl.id} href={`/downloads/${dl.slug}`} className="flex gap-4 rounded-[8px] border border-gold/10 bg-white p-5 hover:border-gold/30 transition-colors">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-gold to-gold-dark text-2xl">
                  📄
                </div>
                <div>
                  <h3 className="font-serif text-base font-medium text-brown">{dl.title}</h3>
                  {dl.description && <p className="mt-1 text-sm text-charcoal/55 line-clamp-2">{dl.description}</p>}
                  <span className="badge-free mt-2 text-xs">Free</span>
                </div>
              </Link>
            )) : (
              [{ name: 'Daily Prayer Guide', desc: 'Morning and evening prayers. Includes Ge\'ez transliteration.' }, { name: 'Fasting Calendar 2025', desc: 'Complete Ethiopian Orthodox fasting schedule with explanations.' }].map((item) => (
                <Link key={item.name} href="/downloads" className="flex gap-4 rounded-[8px] border border-gold/10 bg-white p-5 hover:border-gold/30 transition-colors">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-gold to-gold-dark text-2xl">📄</div>
                  <div>
                    <h3 className="font-serif text-base font-medium text-brown">{item.name}</h3>
                    <p className="mt-1 text-sm text-charcoal/55">{item.desc}</p>
                    <span className="badge-free mt-2 inline-flex">Free</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: 'KDP Books', desc: 'Curated Amazon affiliate titles on Ethiopian Orthodox theology and history.' },
            { icon: Download, title: 'Digital Downloads', desc: 'Instant Gumroad delivery — ebooks, prayers, guides, and liturgical texts.' },
            { icon: Package, title: 'Premium Merch', desc: 'Print-on-demand products with Ethiopian Orthodox designs via Fourthwall.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[8px] border border-gold/10 bg-white p-6">
              <item.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-3 font-serif text-lg text-brown">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/55">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ─────────────────────────────────────────── */}
      <div className="bg-cream-dark">
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h2 className="font-serif text-3xl text-brown">Stay Connected</h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/60">New books, free resources, and spiritual content — delivered to your inbox.</p>
          <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); }}>
            <input type="email" required placeholder="name@example.com" className="flex-1 rounded-[2px] border border-brown/15 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
            <button type="submit" className="btn-dark px-5 py-2.5">Subscribe</button>
          </form>
        </div>
      </div>

    </div>
  );
}
