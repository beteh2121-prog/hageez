'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { SanityPost } from '@/types';

interface BlogBrowserProps {
  posts: SanityPost[];
}

export default function BlogBrowser({ posts }: BlogBrowserProps) {
  const categories = ['all', ...Array.from(new Set(posts.flatMap((p) => p.tags ?? [])))];
  const [category, setCategory] = useState('all');

  const filtered = category === 'all' ? posts : posts.filter((p) => p.tags?.includes(category));
  const [featured, ...rest] = filtered;

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={category === cat ? 'filter-pill active' : 'filter-pill'}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center text-charcoal/40">
          <p className="font-serif text-lg">No posts found</p>
        </div>
      ) : (
        <>
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="group mb-10 block">
              <div className="grid overflow-hidden rounded-brand-md border border-gold/10 transition-shadow hover:shadow-gold-md md:grid-cols-2">
                <div className="relative aspect-video overflow-hidden bg-brown md:aspect-auto">
                  {featured.coverImage ? (
                    <Image
                      src={featured.coverImage}
                      alt={featured.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-ethiopic text-5xl text-gold/40">✝</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center bg-white p-8">
                  {featured.tags?.[0] && (
                    <span className="mb-4 w-fit rounded-full bg-gold px-3 py-1 text-xs text-cream">
                      {featured.tags[0]}
                    </span>
                  )}
                  <h2 className="font-serif text-2xl font-bold leading-tight text-brown transition-colors group-hover:text-gold">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-charcoal/60">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-xs text-charcoal/50">
                    {featured.author?.name && <span>{featured.author.name}</span>}
                    {featured.readingTime && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {featured.readingTime} min
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-brand-md border border-gold/10 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-gold-md"
                >
                  <div className="relative aspect-video overflow-hidden bg-brown">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-ethiopic text-3xl text-gold/40">✝</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {post.tags?.[0] && (
                      <span className="mb-2 inline-block rounded-full bg-cream-dark px-2.5 py-0.5 text-[11px] capitalize text-charcoal/60">
                        {post.tags[0]}
                      </span>
                    )}
                    <h3 className="line-clamp-2 font-serif text-base font-semibold text-brown transition-colors group-hover:text-gold">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-xs text-charcoal/55">{post.excerpt}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-charcoal/45">
                      {post.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} min
                        </span>
                      )}
                      <span className="ml-auto text-gold">Read →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
