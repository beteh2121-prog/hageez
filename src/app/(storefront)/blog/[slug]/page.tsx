import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
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
        <div className="flex gap-12">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-4xl text-brown">{post.title}</h1>
            <p className="mt-2 text-sm text-charcoal/50">
              {formatDate(post.publishedAt)} · {post.readingTime} min read
            </p>

            {post.coverImage && (
              <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-brand-md">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              </div>
            )}

            {post.tableOfContents && (
              <div className="mt-6 lg:hidden">
                <TableOfContents blocks={headingBlocks} />
              </div>
            )}

            <div className="prose mt-8 max-w-none">
              <PortableText value={blocks} components={components} />
            </div>

            {post.author && (
              <div className="mt-12 flex items-center gap-4 border-t border-gold/20 pt-6">
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
              <div className="mt-12">
                <h2 className="font-serif text-2xl text-brown">Related Posts</h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {post.relatedPosts.map((related) => (
                    <li key={related.slug}>
                      <a href={`/blog/${related.slug}`} className="text-gold hover:underline">
                        {related.title}
                      </a>
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
