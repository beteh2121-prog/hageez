import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import { buildMarketplaceUrl } from '@/lib/amazon/affiliate';
import type { KdpBook } from '@/types';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Books',
  description: 'Curated Ethiopian Orthodox theology and literature — KDP titles on Amazon.',
};

const CATEGORIES = ['All', 'Theology', 'History', 'Liturgy', 'Spirituality', 'Amharic'];

async function getBooks(): Promise<KdpBook[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('kdp_books')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return (data ?? []) as KdpBook[];
}

const COVER_GRADIENTS = [
  'from-brown to-brown-light',
  'from-brown-dark to-brown',
  'from-brown-light to-gold-dark',
  'from-[#0F2B1E] to-[#1D5E3A]',
];

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">Books</h1>
          <p className="mt-2 text-cream/50">Amazon KDP affiliate titles — curated Ethiopian Orthodox theology and literature</p>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map((cat) => (
          <button key={cat} className={`filter-pill ${cat === 'All' ? 'active' : ''}`}>{cat}</button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {books.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {books.map((book, i) => {
              let affiliateUrl = '#';
              try { affiliateUrl = buildMarketplaceUrl(book.asin, book.marketplace); } catch { /* skip */ }
              return (
                <div key={book.id} className="group flex flex-col">
                  <Link href={`/books/${book.asin}`}>
                    <div className={`relative aspect-[3/4] overflow-hidden rounded-[6px] bg-gradient-to-br ${COVER_GRADIENTS[i % 4]} shadow-gold-sm group-hover:shadow-gold-md transition-shadow`}>
                      {book.cover_image_url ? (
                        <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center font-serif text-5xl text-gold/30">✝</div>
                      )}
                      {book.is_featured && (
                        <span className="absolute right-2 top-2 rounded-[2px] bg-gold px-2 py-0.5 text-[10px] font-medium text-brown-dark">
                          Featured
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="mt-3 flex flex-1 flex-col">
                    <Link href={`/books/${book.asin}`}>
                      <h3 className="font-serif text-sm font-medium leading-snug text-brown line-clamp-2 hover:text-gold transition-colors">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="mt-1 text-xs text-charcoal/50">{book.author}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gold">
                        {book.price_usd ? `$${book.price_usd.toFixed(2)}` : 'On Amazon'}
                      </p>
                    </div>
                    <a
                      href={affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="btn-dark mt-3 gap-1.5 text-xs"
                    >
                      Buy on Amazon <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {['The Fetha Negest', 'Liturgy of St. Yared', 'Didascalia Apostolorum', 'Andemta Commentary', 'The Kebra Nagast', 'Church of Ethiopia', 'Weddase Maryam', 'Hawi — Amharic'].map((title, i) => (
              <div key={title} className="group flex flex-col">
                <div className={`relative aspect-[3/4] overflow-hidden rounded-[6px] bg-gradient-to-br ${COVER_GRADIENTS[i % 4]} shadow-gold-sm`}>
                  <div className="flex h-full items-center justify-center text-5xl">{['📖','✝️','🕊️','🌿','🙏','🕍','📜','🌙'][i]}</div>
                  {i === 0 && <span className="absolute right-2 top-2 rounded-[2px] bg-gold px-2 py-0.5 text-[10px] font-medium text-brown-dark">Bestseller</span>}
                  {i === 5 && <span className="absolute right-2 top-2 rounded-[2px] bg-gold px-2 py-0.5 text-[10px] font-medium text-brown-dark">New</span>}
                </div>
                <div className="mt-3">
                  <h3 className="font-serif text-sm font-medium leading-snug text-brown">{title}</h3>
                  <p className="mt-1 text-xs text-charcoal/50">Traditional</p>
                  <p className="mt-2 text-sm font-medium text-gold">On Amazon</p>
                  <Link href="/books" className="btn-dark mt-3 gap-1.5 text-xs inline-flex w-full justify-center">
                    Buy on Amazon <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-charcoal/35">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
      </div>
    </div>
  );
}
