'use client';

import { useEffect, useState } from 'react';
import type { PortableTextBlockLike } from '@/lib/sanity/portableText';

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extractHeadings(blocks: PortableTextBlockLike[]): Heading[] {
  return blocks
    .filter((block) => block._type === 'block' && (block.style === 'h2' || block.style === 'h3'))
    .map((block) => {
      const text = (block.children ?? []).map((child) => child.text ?? '').join('');
      return {
        id: slugifyHeading(text),
        text,
        level: (block.style === 'h2' ? 2 : 3) as 2 | 3,
      };
    })
    .filter((heading) => heading.text.length > 0);
}

interface TableOfContentsProps {
  blocks: PortableTextBlockLike[];
}

export default function TableOfContents({ blocks }: TableOfContentsProps) {
  const headings = extractHeadings(blocks);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-120px 0px -70% 0px' }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // Re-run only when the underlying blocks change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  if (headings.length === 0) return null;

  function scrollToHeading(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  const list = (
    <ul className="flex flex-col gap-2 text-sm">
      {headings.map((heading) => (
        <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
          <button
            type="button"
            onClick={() => scrollToHeading(heading.id)}
            className={activeId === heading.id ? 'font-medium text-gold' : 'text-charcoal/60 hover:text-charcoal'}
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <aside className="sticky top-[120px] hidden w-64 shrink-0 lg:block">
        <p className="mb-3 font-serif text-sm uppercase tracking-wide text-brown">Table of Contents</p>
        {list}
      </aside>

      <details className="mb-6 rounded-brand-md border border-gold/30 bg-cream-dark p-4 lg:hidden">
        <summary className="cursor-pointer font-serif text-sm uppercase tracking-wide text-brown">
          Table of Contents
        </summary>
        <div className="mt-3">{list}</div>
      </details>
    </>
  );
}
