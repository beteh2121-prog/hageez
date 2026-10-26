import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { notFound, permanentRedirect } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/static';
import { buildMerchSeo } from '@/lib/utils/buildSeoMetadata';
import { formatPrice } from '@/lib/utils/formatPrice';
import {
  fetchFourthwallProductBySlug,
  findFourthwallProduct,
  type FourthwallStorefrontProduct,
} from '@/lib/fourthwall/client';
import { buildFourthwallProductUrl } from '@/lib/fourthwall/checkout';
import { buildProductJsonLd, buildProductView } from '@/lib/fourthwall/product-view';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_STORE_CURRENCIES,
  isKnownCurrency,
  productPath,
} from '@/lib/fourthwall/routes';
import { getCheckoutOrigin } from '@/lib/fourthwall/shop';
import SchemaScript from '@/components/shared/SchemaScript';
import MerchCard from '@/features/merch/components/MerchCard';
import ProductGallery from '@/features/merch/components/ProductGallery';
import ProductExperience from '@/features/merch/components/ProductExperience';
import type { Merch } from '@/types';

export const revalidate = 300;

// Render on first request (when the Worker's runtime secrets exist) instead
// of at build time, so a product page can never be frozen without variants.
export function generateStaticParams() {
  return [];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'Ethiopian Orthodox Heritage';

interface PageParams {
  currency: string;
  handle: string;
}

function isHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

/** One load per request, shared by generateMetadata and the page. */
const loadProduct = cache(async (handle: string, currency: string) => {
  const supabase = createStaticClient();

  const [fwBySlug, merchBySlug] = await Promise.all([
    fetchFourthwallProductBySlug(handle, currency),
    supabase.from('merch').select('*').eq('slug', handle).maybeSingle(),
  ]);

  let fw: FourthwallStorefrontProduct | null = fwBySlug;
  let merch = (merchBySlug.data as Merch | null) ?? null;

  // Rows synced before the slug fix may carry a title-derived slug. Find the
  // product by id instead; the page then redirects to the real handle.
  if (!fw && merch) {
    fw = await findFourthwallProduct({ id: merch.fourthwall_id, slug: handle });
  }

  if (fw && !merch) {
    const byId = await supabase.from('merch').select('*').eq('fourthwall_id', fw.id).maybeSingle();
    merch = (byId.data as Merch | null) ?? null;
  }

  return { fw, merch };
});

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { fw, merch } = await loadProduct(params.handle, DEFAULT_CURRENCY);
  if (!fw && !merch) return { title: 'Product not found' };

  const handle = fw?.slug ?? params.handle;
  const canonical = `${SITE_URL}${productPath(handle)}`;

  if (merch) {
    const seo = buildMerchSeo(merch, SITE_URL);
    const ogImage = seo.ogImage || fw?.images?.[0]?.url;
    return {
      title: seo.title,
      description: seo.description,
      alternates: { canonical },
      openGraph: { images: ogImage ? [ogImage] : undefined },
    };
  }

  const image = fw?.images?.[0]?.transformedUrl || fw?.images?.[0]?.url;
  return {
    title: `${fw?.name ?? 'Product'} | ${SITE_NAME}`,
    description: fw?.description?.replace(/<[^>]+>/g, ' ').trim().slice(0, 155),
    alternates: { canonical },
    openGraph: { images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: PageParams }) {
  const { currency, handle } = params;

  // /usd/… → /USD/…; other real currencies → the one this store prices in.
  if (!isKnownCurrency(currency)) notFound();
  const upper = currency.toUpperCase();
  if (!SUPPORTED_STORE_CURRENCIES.includes(upper)) permanentRedirect(productPath(handle));
  if (upper !== currency) permanentRedirect(productPath(handle, upper));

  const { fw, merch } = await loadProduct(handle, upper);
  if (!fw && !merch) notFound();
  if (fw && fw.slug !== handle) permanentRedirect(productPath(fw.slug));

  const view = fw ? buildProductView(fw) : null;
  const title = fw?.name ?? merch?.title ?? 'Product';
  const description = fw?.description || merch?.description || '';
  const canBuyHere = Boolean(view && view.variants.length > 0 && !view.soldOut);

  const checkoutOrigin = await getCheckoutOrigin();
  const fallbackUrl = buildFourthwallProductUrl(checkoutOrigin, fw?.slug ?? handle);

  let related: Merch[] = [];
  if (merch && merch.tags.length > 0) {
    const { data } = await createStaticClient()
      .from('merch')
      .select('*')
      .eq('status', 'active')
      .overlaps('tags', merch.tags)
      .neq('id', merch.id)
      .limit(4);
    related = (data as Merch[] | null) ?? [];
  }

  const descriptionBlock = description ? (
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
  ) : null;

  const plainDescription = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {view && (
        <SchemaScript
          schema={buildProductJsonLd(view, `${SITE_URL}${productPath(view.slug)}`, plainDescription)}
        />
      )}

      <nav className="mb-8 flex items-center gap-2 text-sm text-charcoal/50">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-gold">Merch</Link>
        <span>/</span>
        <span className="text-charcoal/80">{title}</span>
      </nav>

      {view && canBuyHere ? (
        <ProductExperience view={view} description={descriptionBlock} />
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery
            images={
              view && view.images.length > 0
                ? view.images
                : (merch?.images ?? []).map((image) => ({ url: image.url, alt: image.alt }))
            }
            title={title}
          />
          <div className="flex flex-col gap-5">
            <h1 className="font-serif text-3xl font-medium text-brown">{title}</h1>
            {merch && (
              <p className="font-serif text-3xl font-medium text-gold">
                {formatPrice(merch.price_cents, merch.currency)}
              </p>
            )}
            {view?.soldOut && <p className="text-sm text-crimson">Currently sold out.</p>}
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
            {descriptionBlock}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 font-serif text-2xl text-brown">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((item) => (
              <MerchCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
