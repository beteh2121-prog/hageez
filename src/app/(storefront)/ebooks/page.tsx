import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, BookOpen } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { Download } from '@/types';

export const revalidate = 1800;
export const metadata: Metadata = {
  title: 'Ebooks',
  description: 'Digital ebooks — instant delivery via Gumroad.',
};

const FILTERS = ['All', 'Free', 'PDF', 'EPUB', 'Audio'];

async function getEbooks(): Promise<Download[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('downloads')
    .select('*')
    .eq('source', 'gumroad')
    .order('created_at', { ascending: false });
  return (data ?? []) as Download[];
}

const COVER_GRADIENTS = [
  'from-[#1D5E3A] to-[#0F2B1E]',
  'from-brown to-brown-dark',
  'from-brown-light to-gold-dark',
  'from-[#3D1F0D] to-[#C9922A]',
  'from-[#0F2B1E] to-[#1D9E75]',
  'from-brown-dark to-brown',
];

export default async function EbooksPage() {
  const ebooks = await getEbooks();

  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">Ebooks</h1>
          <p className="mt-2 text-cream/50">Digital editions via Gumroad — instant delivery to your inbox</p>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f} className={`filter-pill ${f === 'All' ? 'active' : ''}`}>{f}</button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {ebooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {ebooks.map((ebook, i) => (
              <div key={ebook.id} className="group flex flex-col overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow">
                <div className={`relative overflow-hidden bg-gradient-to-br ${COVER_GRADIENTS[i % 6]}`} style={{ aspectRatio:'3/2' }}>
                  {ebook.cover_path ? (
                    <Image src={ebook.cover_path} alt={ebook.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-gold/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-serif text-base font-medium leading-snug text-brown">{ebook.title}</h3>
                  {ebook.file_type && (
                    <p className="mt-1 text-xs uppercase text-charcoal/40">{ebook.file_type} Ebook</p>
                  )}
                  {ebook.description && (
                    <p className="mt-2 text-xs leading-relaxed text-charcoal/55 line-clamp-2">{ebook.description}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    {ebook.price_cents === 0
                      ? <span className="badge-free">Free</span>
                      : <span className="price-text text-sm">{formatPrice(ebook.price_cents)}</span>
                    }
                    {ebook.external_url && (
                      <a
                        href={ebook.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary gap-1.5 px-4 py-2 text-xs"
                      >
                        {ebook.price_cents === 0 ? 'Get Free' : 'Buy Now'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {[
              { emoji:'📱', title:"Ge'ez Alphabet Guide", type:'PDF', free:true },
              { emoji:'📚', title:'Orthodox Fasting Guide', type:'PDF', free:false, price:'$8.99' },
              { emoji:'🕊️', title:'Lives of the Saints', type:'EPUB', free:false, price:'$12.99' },
              { emoji:'✝️', title:'Timkat Celebration', type:'PDF', free:true },
              { emoji:'🌿', title:'Mezmur Collection', type:'Audio+PDF', free:false, price:'$14.99' },
              { emoji:'📿', title:'Kidase Illustrated', type:'PDF', free:false, price:'$9.99' },
            ].map((item, i) => (
              <div key={item.title} className="group flex flex-col overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow">
                <div className={`flex items-center justify-center bg-gradient-to-br ${COVER_GRADIENTS[i % 6]} text-4xl`} style={{ aspectRatio:'3/2' }}>
                  {item.emoji}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-serif text-base font-medium leading-snug text-brown">{item.title}</h3>
                  <p className="mt-1 text-xs uppercase text-charcoal/40">{item.type} Ebook</p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    {item.free
                      ? <span className="badge-free">Free</span>
                      : <span className="price-text text-sm">{item.price}</span>
                    }
                    <Link href="/ebooks" className="btn-primary gap-1.5 px-4 py-2 text-xs inline-flex">
                      {item.free ? 'Get Free' : 'Buy Now'} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
