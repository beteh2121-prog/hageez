import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/sanity/queries';
import SectionHeader from '@/components/shared/SectionHeader';
import BlogBrowser from '@/features/blog/components/BlogBrowser';
import type { SanityPost } from '@/types';

export const revalidate = 600;
export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles on Ethiopian Orthodox faith, history, and culture.',
};

export default async function BlogPage() {
  let posts: SanityPost[] = [];
  try {
    posts = await getAllPosts();
  } catch {
    posts = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeader
        label="Teachings & Reflections"
        title="The Blog"
        subtitle="Exploring Ethiopian Orthodox theology, history, saints, and spiritual life."
        className="mb-10"
      />

      {posts.length > 0 ? (
        <BlogBrowser posts={posts} />
      ) : (
        <div className="rounded-brand-md border border-gold/10 bg-cream-dark/40 p-6 text-center">
          <p className="font-serif text-lg text-brown">Blog posts coming soon</p>
          <p className="mt-2 text-sm text-charcoal/55">
            Create your first post in{' '}
            <a
              href={process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'https://ethiopianorthodoxheritage.sanity.studio'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              Sanity Studio
            </a>
            {' '}and it will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
