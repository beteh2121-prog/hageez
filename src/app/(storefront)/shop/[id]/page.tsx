import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import { buildMerchSeo } from '@/lib/utils/buildSeoMetadata';
import { buildProductSchema } from '@/lib/utils/buildSchemaOrg';
import { findFourthwallProduct } from '@/lib/fourthwall/client';
import { buildFourthwallProductUrl } from '@/lib/fourthwall/checkout';
import { getCheckoutOrigin } from '@/lib/fourthwall/shop';
import SchemaScript from '@/components/shared/SchemaScript';
import MerchCard from '@/features/merch/components/MerchCard';
import ProductGallery from '@/features/merch/components/ProductGallery';
import VariantSelector from '@/features/merch/components/VariantSelector';
import type { Merch } from '@/types';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

function isHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('merch')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []).map((product: { id: string }) => ({ id: product.id }));
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
    openGraph: { images: seo.ogImage ? [seo.ogImage] : undefined },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  // Live data from Fourthwall gives us real variants (sizes/colors) and their
  // ids, which the direct-checkout link needs. If Fourthwall can't be reached
  // we degrade to a plain link to the product on the Fourthwall shop.
  const fwProduct = await findFourthwallProduct({ id: product.fourthwall_id, slug: product.slug });

  // Ask Fourthwall for the real shop domain rather than trusting an env var.
  const checkoutOrigin = await getCheckoutOrigin();
  const fallbackUrl = buildFourthwallProductUrl(checkoutOrigin, fwProduct?.slug ?? product.slug);

  const galleryImages = fwProduct?.images?.length
    ? fwProduct.images.map((img) => ({ url: img.transformedUrl || img.url, alt: product.title }))
    : product.images.map((img) => ({ url: img.url, alt: img.alt }));

  const variants = (fwProduct?.variants ?? []).map((variant) => ({
    id: variant.id,
    name: variant.name,
    unitPrice: variant.unitPrice,
    attributes: variant.attributes,
  }));
  const soldOut = fwProduct?.state?.type === 'SOLD_OUT';
  const canBuyHere = variants.length > 0 && !soldOut;

  const description = fwProduct?.description || product.description;

  const supabase = await createClient();
  const { data: related } = product.tags.length
    ? await supabase
        .from('merch')
        .select('*')
        .eq('status', 'active')
        .overlaps('tags', product.tags)
        .neq('id', product.id)
        .limit(4)
    : { data: [] as Merch[] };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SchemaScript schema={buildProductSchema(product)} />

      <nav className="mb-8 flex items-center gap-2 text-sm text-charcoal/50">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-gold">Merch</Link>
        <span>/</span>
        <span className="text-charcoal/80">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={galleryImages} title={product.title} />

        <div className="flex flex-col gap-5">
          <h1 className="font-serif text-3xl font-medium text-brown">{product.title}</h1>

          {description && (
            <div className="border-t border-gold/10 pt-4">
              {isHtml(description) ? (
                <div
                  className="prose prose-sm max-w-none text-charcoal/70 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-sm leading-relaxed text-charcoal/70">{description}</p>
              )}
            </div>
          )}

          <div className="border-t border-gold/10 pt-4">
            {canBuyHere ? (
              <VariantSelector variants={variants} />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-serif text-3xl font-medium text-gold">
                  ${(product.price_cents / 100).toFixed(2)}
                </p>
                {soldOut && <p className="text-sm text-crimson">Currently sold out.</p>}
                {fallbackUrl && (
                  <a
                    href={fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full gap-2"
                  >
                    View &amp; buy on Fourthwall <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 font-serif text-2xl text-brown">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {(related as Merch[]).map((item) => (
              <MerchCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
