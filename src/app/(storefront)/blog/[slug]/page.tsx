import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import { getAllPosts, getPostBySlug } from '@/lib/sanity/queries';
import { createClient } from '@/lib/supabase/server';
import { asPortableTextBlocks } from '@/lib/sanity/portableText';
import { createPortableTextComponents } from '@/features/blog/components/PortableTextComponents';
import ReadingProgress from '@/features/blog/components/ReadingProgress';
import TableOfContents from '@/features/blog/components/TableOfContents';
import { formatDate } from '@/lib/utils/formatDate';
import type { KdpBook } from '@/types';

export const revalidate = 600;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Post not found' };

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    openGraph: {
      images: post.ogImage ? [post.ogImage] : post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const blocks = asPortableTextBlocks(post.body);
  const asins = blocks
    .filter((block) => block._type === 'kdpBookEmbed' && typeof block.bookAsin === 'string')
    .map((block) => block.bookAsin as string);

  let bookMap: Record<string, KdpBook> = {};

  if (asins.length > 0) {
    const supabase = await createClient();
    const { data: books } = await supabase.from('kdp_books').select('*').in('asin', asins);
    bookMap = Object.fromEntries((books ?? []).map((book) => [book.asin, book as KdpBook]));
  }

  const components = createPortableTextComponents(bookMap);
  const headingBlocks = blocks.filter((block) => block._type === 'block');

  return (
    <>
      <ReadingProgress />

      <article className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-charcoal/50 transition-colors hover:text-brown"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <div className="flex gap-12">
          <div className="min-w-0 flex-1">
            {post.tags?.[0] && (
              <span className="mb-4 inline-block rounded-full bg-gold px-3 py-1 text-xs text-cream">
                {post.tags[0]}
              </span>
            )}
            <h1 className="font-serif text-3xl font-bold leading-tight text-brown md:text-5xl">{post.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-charcoal/50">
              {post.author?.name && <span>by {post.author.name}</span>}
              {post.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime} min read
                </span>
              )}
              <span>{formatDate(post.publishedAt)}</span>
            </div>

            {post.coverImage && (
              <div className="relative mt-8 aspect-video overflow-hidden rounded-brand-md">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}

            {post.tableOfContents && (
              <div className="mt-6 lg:hidden">
                <TableOfContents blocks={headingBlocks} />
              </div>
            )}

            <div className="prose mt-10 max-w-none">
              <PortableText value={blocks} components={components} />
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-gold/15 pt-8">
                {post.tags.map((tag) => (
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

            {post.author && (
              <div className="mt-10 flex items-center gap-4 border-t border-gold/15 pt-8">
                {post.author.image && (
                  <Image
                    src={post.author.image}
                    alt={post.author.name}
                    width={56}
                    height={56}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-serif text-base text-brown">{post.author.name}</p>
                  {post.author.bio && <p className="text-sm text-charcoal/60">{post.author.bio}</p>}
                </div>
              </div>
            )}

            {post.relatedPosts.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold text-brown">Related Posts</h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {post.relatedPosts.map((related) => (
                    <li key={related.slug}>
                      <Link href={`/blog/${related.slug}`} className="text-gold hover:underline">
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {post.tableOfContents && (
            <div className="hidden lg:block">
              <TableOfContents blocks={headingBlocks} />
            </div>
          )}
        </div>
      </article>
    </>
  );
}
