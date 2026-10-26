import type { Metadata } from 'next';
import { productPath } from '@/lib/fourthwall/routes';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Tag } from 'lucide-react';
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
  return (data ?? []).map((book: { asin: string }) => ({ asin: book.asin }));
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
    <div className="mx-auto max-w-5xl px-6 py-16">
      <SchemaScript schema={buildBookSchema(book)} />

      <Link
        href="/books"
        className="mb-8 inline-flex items-center gap-1 text-sm text-charcoal/50 transition-colors hover:text-brown"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Books
      </Link>

      <div className="grid gap-12 md:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-brand-md bg-cream-dark shadow-gold-md">
            {book.cover_image_url ? (
              <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brown to-brown-light">
                <BookOpen className="h-16 w-16 text-gold/40" />
              </div>
            )}
          </div>

          <div className="mt-5">
            <AffiliateButton book={book} size="md" fullWidth />
          </div>
        </div>

        <div>
          {book.categories[0] && (
            <span className="text-xs uppercase tracking-widest text-gold">{book.categories[0]}</span>
          )}
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-brown md:text-4xl">
            {book.title}
          </h1>
          {book.subtitle && <p className="mt-1 text-lg text-charcoal/60">{book.subtitle}</p>}
          <p className="mt-1 text-charcoal/60">
            by <span className="font-medium text-brown">{book.author}</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {book.language && (
              <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs capitalize text-charcoal/60">
                {book.language}
              </span>
            )}
            {book.page_count && (
              <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs text-charcoal/60">
                {book.page_count} pages
              </span>
            )}
            {book.published_date && (
              <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs text-charcoal/60">
                {new Date(book.published_date).getFullYear()}
              </span>
            )}
          </div>

          <div className="prose prose-sm mt-8 max-w-none">
            <h3 className="mb-3 font-serif text-lg font-semibold text-brown">About This Book</h3>
            <p className="whitespace-pre-line leading-relaxed text-charcoal/70">
              {book.custom_description ?? book.description}
            </p>
          </div>

          {book.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-2.5 py-1 text-xs text-charcoal/60"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-charcoal/40">ASIN: {book.asin}</p>

          <div className="mt-6 rounded-brand-md border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            <strong>Affiliate Notice:</strong> This is an Amazon affiliate link. We earn a small commission
            on qualifying purchases at no extra cost to you. This supports our ministry.
          </div>
        </div>
      </div>

      {(book.related_blog_slug || relatedMerch || moreByAuthor.length > 0) && (
        <div className="mt-16 flex flex-col gap-10">
          {book.related_blog_slug && (
            <Link
              href={`/blog/${book.related_blog_slug}`}
              className="block rounded-brand-md border border-gold/20 p-4 transition-colors hover:border-gold"
            >
              Read the related article →
            </Link>
          )}

          {relatedMerch && (
            <Link
              href={productPath(relatedMerch.slug)}
              className="block rounded-brand-md border border-gold/20 p-4 transition-colors hover:border-gold"
            >
              Shop the related product: {relatedMerch.title} →
            </Link>
          )}

          {moreByAuthor.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-brown">More books by {book.author}</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {moreByAuthor.map((other) => (
                  <Link key={other.id} href={`/books/${other.asin}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-brand-md bg-cream-dark">
                      {other.cover_image_url && (
                        <Image
                          src={other.cover_image_url}
                          alt={other.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-2 font-serif text-sm font-semibold text-brown">{other.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
