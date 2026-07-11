import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { Merch } from '@/types';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Merch',
  description: 'Ethiopian Orthodox print-on-demand products via Fourthwall.',
};

const FILTERS = ['All', 'T-Shirts', 'Prints', 'Mugs', 'Accessories', 'Hoodies'];

async function getMerch(): Promise<Merch[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('merch')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  return (data ?? []) as Merch[];
}

const PLACEHOLDER_BG = ['#FAF4E8', '#F0E4CC', '#1C0D06', '#EAF3DE', '#F0E4CC', '#1C0D06'];

export default async function ShopPage() {
  const products = await getMerch();

  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">Merch</h1>
          <p className="mt-2 text-cream/50">Print-on-demand products powered by Fourthwall</p>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f} className={`filter-pill ${f === 'All' ? 'active' : ''}`}>{f}</button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="group overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow">
                <Link href={`/shop/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-cream-dark">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-gold/20" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-5">
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="font-serif text-lg font-medium text-brown hover:text-gold transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-base font-medium text-gold">
                    {formatPrice(product.price_cents, product.currency)}
                  </p>
                  <Link href={`/shop/${product.id}`} className="btn-dark mt-4 w-full gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji:'✝️', name:'Ethiopian Cross Tee', price:'$32.00', bg:'#FAF4E8' },
              { emoji:'🕍', name:'Lalibela Art Print', price:'$28.00', bg:'#F0E4CC' },
              { emoji:'📿', name:'Prayer Beads Mug', price:'$19.00', bg:'#1C0D06' },
              { emoji:'🌿', name:'Timkat Hoodie', price:'$55.00', bg:'#EAF3DE' },
              { emoji:'🕊️', name:'Dove of Peace Tote', price:'$24.00', bg:'#F0E4CC' },
              { emoji:'✝️', name:'Cross Phone Case', price:'$22.00', bg:'#1C0D06' },
            ].map((item) => (
              <div key={item.name} className="group overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow">
                <div className="flex aspect-square items-center justify-center text-7xl" style={{ background: item.bg }}>
                  {item.emoji}
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg font-medium text-brown">{item.name}</h3>
                  <p className="mt-1 text-base font-medium text-gold">{item.price}</p>
                  <Link href="/shop" className="btn-dark mt-4 inline-flex w-full items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
