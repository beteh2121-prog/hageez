import Link from 'next/link';
import { createStaticClient } from '@/lib/supabase/static';
import ProductCard from '@/components/shared/ProductCard';
import type { Merch } from '@/types';

export const revalidate = 3600;

async function getFeaturedProducts(): Promise<Merch[]> {
  const supabase = createStaticClient();

  // Try featured products first
  const { data: featured } = await supabase
    .from('merch')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .limit(3);

  if (featured && featured.length > 0) {
    return featured as Merch[];
  }

  // Fall back to the 3 most recent active products
  const { data: recent } = await supabase
    .from('merch')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3);

  return (recent ?? []) as Merch[];
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h1 className="font-serif text-4xl text-brown sm:text-5xl">
          Rooted in Faith. Crafted with Purpose.
        </h1>
        <p className="max-w-xl text-charcoal/70">
          Ethiopian Orthodox crafts, digital resources, and books — curated with reverence and
          built for the modern faithful.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="btn-primary">
            Shop the Collection
          </Link>
          <Link href="/books" className="btn-secondary">
            Browse Books
          </Link>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-brown sm:text-3xl">Featured Products</h2>
            <Link href="/shop" className="text-sm text-gold hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Value proposition */}
      <section className="bg-brown px-6 py-16 text-center text-cream">
        <h2 className="font-serif text-3xl">More than a store</h2>
        <p className="mx-auto mt-4 max-w-xl text-cream/70">
          Explore our digital downloads, KDP books, and blog — all rooted in
          Ethiopian Orthodox faith and culture.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/downloads" className="btn-secondary border-cream/40 text-cream hover:bg-cream/10">
            Digital Downloads
          </Link>
          <Link href="/blog" className="btn-secondary border-cream/40 text-cream hover:bg-cream/10">
            Read the Blog
          </Link>
        </div>
      </section>
    </div>
  );
}
