import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { getFeaturedPosts, getAllPosts } from '@/lib/sanity/queries';
import { formatDate } from '@/lib/utils/formatDate';
import type { SanityPost } from '@/types';

export const revalidate = 600;
export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles on Ethiopian Orthodox faith, history, and culture.',
};

const FILTERS = ['All', 'Theology', 'History', 'Saints', 'Liturgy', 'Culture'];

const PLACEHOLDER_POSTS = [
  { title: 'The Significance of the Ethiopian Cross in Tewahedo Tradition', category: 'Theology', date: 'Jun 15, 2025', readTime: '8 min', bg: 'from-brown-dark to-brown', emoji: '✝️' },
  { title: 'Lalibela: The Jerusalem of Africa — A Complete Guide', category: 'History', date: 'Jun 8, 2025', readTime: '12 min', bg: 'from-brown to-brown-light', emoji: '🕍' },
  { title: 'St. Yared: The Father of Ethiopian Sacred Music', category: 'Saints', date: 'May 30, 2025', readTime: '10 min', bg: 'from-[#0F2B1E] to-[#1D5E3A]', emoji: '🕊️' },
  { title: 'Understanding the Ethiopian Orthodox Fasting Tradition', category: 'Liturgy', date: 'May 22, 2025', readTime: '7 min', bg: 'from-[#4A1B0C] to-[#D85A30]', emoji: '🌿' },
  { title: "The Kebra Nagast: Ethiopia's National Epic", category: 'History', date: 'May 14, 2025', readTime: '9 min', bg: 'from-brown-dark to-brown-light', emoji: '📜' },
  { title: 'Miaphysitism Explained: What Makes the Tewahedo Church Unique', category: 'Theology', date: 'May 5, 2025', readTime: '11 min', bg: 'from-[#0F2B1E] to-[#1D9E75]', emoji: '🙏' },
];

export default async function BlogPage() {
  let posts: SanityPost[] = [];
  try {
    posts = await getAllPosts();
  } catch {
    posts = [];
  }

  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">Blog</h1>
          <p className="mt-2 text-cream/50">Articles on Ethiopian Orthodox faith, history, and culture</p>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f} className={`filter-pill ${f === 'All' ? 'active' : ''}`}>{f}</button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm hover:shadow-gold-md transition-shadow"
              >
                <div className="relative h-44 overflow-hidden bg-brown">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-5xl text-gold/20">✝</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {post.tags?.[0] && (
                    <p className="mb-2 text-[11px] uppercase tracking-[1.5px] text-gold">{post.tags[0]}</p>
                  )}
                  <h3 className="font-serif text-base font-medium leading-snug text-brown line-clamp-2 group-hover:text-gold transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal/55 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-charcoal/40">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readingTime} min read
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_POSTS.map((post) => (
              <div key={post.title} className="group flex flex-col overflow-hidden rounded-[8px] border border-gold/10 bg-white shadow-gold-sm">
                <div className={`flex h-44 items-center justify-center bg-gradient-to-br ${post.bg} text-5xl`}>
                  {post.emoji}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="mb-2 text-[11px] uppercase tracking-[1.5px] text-gold">{post.category}</p>
                  <h3 className="font-serif text-base font-medium leading-snug text-brown line-clamp-2">{post.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-4 text-xs text-charcoal/40">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime} read
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="mt-10 rounded-[8px] border border-gold/10 bg-cream-dark/40 p-6 text-center">
            <p className="font-serif text-lg text-brown">Blog posts coming soon</p>
            <p className="mt-2 text-sm text-charcoal/55">
              Create your first post in{' '}
              <a href={process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'https://ethiopianorthodoxheritage.sanity.studio'}
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
    </div>
  );
}
