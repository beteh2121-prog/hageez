import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { buildMerchSeo } from '@/lib/utils/buildSeoMetadata';
import ProductCard from '@/components/shared/ProductCard';
import EmptyState from '@/components/shared/EmptyState';
import ShopFilterBar from '@/components/shared/ShopFilterBar';
import type { Merch } from '@/types';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('merch')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .limit(1)
    .maybeSingle();

  if (data) {
    const seo = buildMerchSeo(data as Merch, SITE_URL);
    return {
      title: 'Shop',
      description: seo.description || 'Browse our collection of Ethiopian Orthodox crafts.',
      openGraph: { images: seo.ogImage ? [seo.ogImage] : undefined },
    };
  }

  return { title: 'Shop', description: 'Browse our collection of Ethiopian Orthodox crafts.' };
}

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const tagParam = Array.isArray(searchParams.tag) ? searchParams.tag[0] : searchParams.tag;

  const supabase = await createClient();
  let query = supabase.from('merch').select('*').eq('status', 'active');

  if (tagParam) {
    query = query.contains('tags', [tagParam]);
  }

  const { data: products } = await query.order('created_at', { ascending: false });
  const typedProducts = (products ?? []) as Merch[];

  const allTags = Array.from(new Set(typedProducts.flatMap((p) => p.tags)));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-serif text-3xl text-brown sm:text-4xl">Our Collection</h1>
      <p className="mt-2 text-charcoal/60">{typedProducts.length} products</p>

      <ShopFilterBar tags={allTags} activeTag={tagParam} />

      {typedProducts.length === 0 ? (
        <EmptyState message="No products found." />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {typedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
