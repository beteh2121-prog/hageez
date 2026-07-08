import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import { buildMerchSeo } from '@/lib/utils/buildSeoMetadata';
import { buildProductSchema } from '@/lib/utils/buildSchemaOrg';
import SchemaScript from '@/components/shared/SchemaScript';
import PriceTag from '@/components/shared/PriceTag';
import ProductCard from '@/components/shared/ProductCard';
import AddToCartButton from '@/components/shared/AddToCartButton';
import type { Merch } from '@/types';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('merch')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  return (data ?? []).map((product) => ({ id: product.id }));
}

async function getProduct(id: string): Promise<Merch | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('merch').select('*').eq('id', id).single();
  return data as Merch | null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: 'Product not found' };

  const seo = buildMerchSeo(product, SITE_URL);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.canonicalUrl },
    openGraph: { images: seo.ogImage ? [seo.ogImage] : undefined },
  };
}

function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const supabase = await createClient();
  const { data: related } = product.tags.length
    ? await supabase
        .from('merch')
        .select('*')
        .eq('status', 'active')
        .overlaps('tags', product.tags)
        .neq('id', product.id)
        .limit(3)
    : { data: [] as Merch[] };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <SchemaScript schema={buildProductSchema(product)} />

      <nav className="mb-6 text-sm text-charcoal/50">
        <Link href="/shop" className="hover:text-gold">Shop</Link>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-5">
        {/* Image column */}
        <div className="md:col-span-2">
          <div className="relative aspect-square overflow-hidden rounded-brand-md bg-cream-dark">
            {product.images[0] && (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-brand bg-cream-dark">
                  <Image src={image.url} alt={image.alt} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details column */}
        <div className="md:col-span-3">
          <h1 className="font-serif text-3xl text-brown">{product.title}</h1>
          <div className="mt-3">
            <PriceTag cents={product.price_cents} currency={product.currency} />
          </div>

          {/* Description — render as HTML if Fourthwall sent rich text,
              otherwise render as plain text */}
          {product.description && (
            <div className="mt-4">
              {isHtml(product.description) ? (
                <div
                  className="prose prose-sm max-w-none text-charcoal/70 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-charcoal/70">{product.description}</p>
              )}
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-cream-dark px-3 py-1 text-xs text-charcoal/60">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Add to Cart — stays on site, checkout via Fourthwall cart API */}
          <div className="mt-6">
            <AddToCartButton product={product} />
            <p className="mt-2 text-xs text-charcoal/40">
              Secure checkout powered by Fourthwall
            </p>
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl text-brown">You may also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {(related as Merch[]).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
