import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import { buildMerchSeo } from '@/lib/utils/buildSeoMetadata';
import { buildProductSchema } from '@/lib/utils/buildSchemaOrg';
import SchemaScript from '@/components/shared/SchemaScript';
import ProductGallery from '@/features/merch/components/ProductGallery';
import VariantSelector from '@/features/merch/components/VariantSelector';
import type { Merch } from '@/types';

export const revalidate = 3600;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const STOREFRONT_API = 'https://storefront-api.fourthwall.com/v1';

// ── Fourthwall types ─────────────────────────────────────────────────────
interface FWVariant {
  id: string;
  name: string;
  unitPrice: { value: number; currency: string };
  images: { url: string; transformedUrl: string }[];
  attributes?: { name: string; value: string }[];
}

interface FWProduct {
  id: string;
  name: string;
  description: string;
  images: { url: string; transformedUrl: string }[];
  variants: FWVariant[];
}

async function fetchFourthwallProduct(fourthwallId: string): Promise<FWProduct | null> {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token || !fourthwallId) return null;
  try {
    const res = await fetch(
      `${STOREFRONT_API}/products/${fourthwallId}?storefront_token=${token}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as FWProduct;
  } catch {
    return null;
  }
}

function isHtml(str: string) {
  return /<[a-z][\s\S]*>/i.test(str);
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('merch')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []).map((p: { id: string }) => ({ id: p.id }));
}

async function getProduct(id: string): Promise<Merch | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('merch')
    .select('*')
    .eq('id', id)
    .single();
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

  // Fetch live variant + image data from Fourthwall
  const fwProduct = await fetchFourthwallProduct(product.fourthwall_id);

  // Build gallery images — prefer Fourthwall's live images, fall back to synced
  const galleryImages = fwProduct?.images.length
    ? fwProduct.images.map((img) => ({
        url: img.transformedUrl || img.url,
        alt: product.title,
      }))
    : product.images.map((img) => ({ url: img.url, alt: img.alt }));

  // Build variants for the selector
  const variants = fwProduct?.variants.map((v) => ({
    id: v.id,
    name: v.name,
    unitPrice: v.unitPrice,
    attributes: v.attributes,
  })) ?? [{
    id: product.fourthwall_id,
    name: 'Default',
    unitPrice: { value: product.price_cents / 100, currency: product.currency },
  }];

  // Fetch related products
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

  const description = fwProduct?.description ?? product.description;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SchemaScript schema={buildProductSchema(product)} />

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-charcoal/50">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-gold">Merch</Link>
        <span>/</span>
        <span className="text-charcoal/80">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={galleryImages} title={product.title} />

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-serif text-3xl font-medium text-brown">{product.title}</h1>
            {product.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-cream-dark px-3 py-1 text-xs text-charcoal/60">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
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

          {/* Variant selector + cart/buy */}
          <div className="border-t border-gold/10 pt-4">
            <VariantSelector
              productId={product.fourthwall_id}
              productDbId={product.id}
              productTitle={product.title}
              productImage={galleryImages[0]?.url}
              variants={variants}
            />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-gold/10 pt-4">
            {[
              { emoji: '✝', label: 'Faith-centered' },
              { emoji: '📦', label: 'Ships worldwide' },
              { emoji: '🔒', label: 'Secure checkout' },
            ].map((badge) => (
              <div key={badge.label} className="rounded-[6px] bg-cream-dark/60 px-3 py-2 text-center">
                <div className="text-xl">{badge.emoji}</div>
                <p className="mt-1 text-[11px] text-charcoal/55">{badge.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related && related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 font-serif text-2xl text-brown">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {(related as Merch[]).map((item) => (
              <Link
                key={item.id}
                href={`/shop/${item.id}`}
                className="group overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow"
              >
                <div className="relative aspect-square overflow-hidden bg-cream-dark">
                  {item.images[0] ? (
                    <Image
                      src={item.images[0].url}
                      alt={item.images[0].alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">✝</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-serif text-sm font-medium text-brown line-clamp-2">{item.title}</h3>
                  <p className="mt-1 text-sm font-medium text-gold">
                    ${(item.price_cents / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
