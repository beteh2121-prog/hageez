import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';
import { buildBookSeo } from '@/lib/utils/buildSeoMetadata';
import { buildBookSchema } from '@/lib/utils/buildSchemaOrg';
import SchemaScript from '@/components/shared/SchemaScript';
import AffiliateButton from '@/features/books/components/AffiliateButton';
import type { KdpBook, Merch } from '@/types';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase.from('kdp_books').select('asin').eq('is_published', true);
  return (data ?? []).map((book) => ({ asin: book.asin }));
}

async function getBook(asin: string): Promise<KdpBook | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('kdp_books').select('*').eq('asin', asin).single();
  return data as KdpBook | null;
}

export async function generateMetadata({ params }: { params: { asin: string } }): Promise<Metadata> {
  const book = await getBook(params.asin);
  if (!book) return { title: 'Book not found' };

  const seo = buildBookSeo(book, SITE_URL);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.canonicalUrl },
    openGraph: { type: 'book', images: seo.ogImage ? [seo.ogImage] : undefined },
  };
}

export default async function BookPage({ params }: { params: { asin: string } }) {
  const book = await getBook(params.asin);
  if (!book) notFound();

  const supabase = await createClient();

  const [relatedMerchResult, moreByAuthorResult] = await Promise.all([
    book.related_merch_id
      ? supabase.from('merch').select('*').eq('id', book.related_merch_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('kdp_books')
      .select('*')
      .eq('author', book.author)
      .neq('id', book.id)
      .eq('is_published', true)
      .limit(3),
  ]);

  const relatedMerch = relatedMerchResult.data as Merch | null;
  const moreByAuthor = (moreByAuthorResult.data ?? []) as KdpBook[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <SchemaScript schema={buildBookSchema(book)} />

      <div className="grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="relative aspect-[2/3] overflow-hidden rounded-brand-md bg-cream-dark">
            {book.cover_image_url && (
              <Image src={book.cover_image_url} alt={book.title} fill className="object-contain" />
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <h1 className="font-serif text-[28px] text-brown">{book.title}</h1>
          <p className="mt-1 text-charcoal/60">by {book.author}</p>

          {book.price_usd !== null ? (
            <p className="mt-3 font-semibold text-gold-dark">${book.price_usd.toFixed(2)}</p>
          ) : (
            <span className="mt-3 inline-block rounded-full bg-gold/10 px-3 py-1 text-sm text-gold-dark">
              Available on Amazon
            </span>
          )}

          {(book.custom_description ?? book.description) && (
            <p className="mt-4 line-clamp-3 text-charcoal/70">{book.custom_description ?? book.description}</p>
          )}

          <dl className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/60">
            {book.page_count !== null && (
              <div>
                <dt className="inline font-medium">Pages: </dt>
                <dd className="inline">{book.page_count}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium">Language: </dt>
              <dd className="inline">{book.language}</dd>
            </div>
            {book.published_date && (
              <div>
                <dt className="inline font-medium">Published: </dt>
                <dd className="inline">{book.published_date}</dd>
              </div>
            )}
          </dl>

          {book.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-cream-dark px-3 py-1 text-xs text-charcoal/60">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6">
            <AffiliateButton book={book} size="lg" fullWidth />
            <p className="mt-2 text-xs text-brown/50">As an Amazon Associate I earn from qualifying purchases.</p>
          </div>
        </div>
      </div>

      {(book.related_blog_slug || relatedMerch || moreByAuthor.length > 0) && (
        <div className="mt-16 flex flex-col gap-10">
          {book.related_blog_slug && (
            <a
              href={`/blog/${book.related_blog_slug}`}
              className="block rounded-brand-md border border-gold/20 p-4 hover:border-gold"
            >
              Read the related article →
            </a>
          )}

          {relatedMerch && (
            <a
              href={`/shop/${relatedMerch.id}`}
              className="block rounded-brand-md border border-gold/20 p-4 hover:border-gold"
            >
              Shop the related product: {relatedMerch.title} →
            </a>
          )}

          {moreByAuthor.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl text-brown">More books by {book.author}</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {moreByAuthor.map((other) => (
                  <a key={other.id} href={`/books/${other.asin}`} className="block">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-brand-md bg-cream-dark">
                      {other.cover_image_url && (
                        <Image src={other.cover_image_url} alt={other.title} fill className="object-contain" />
                      )}
                    </div>
                    <p className="mt-2 font-serif text-sm text-brown">{other.title}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
