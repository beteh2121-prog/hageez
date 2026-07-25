import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug, getPublishedPages } from '@/lib/supabase/settings';

export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await getPublishedPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getPageBySlug(params.slug);
  if (!page) return { title: 'Page not found' };
  return { title: page.title };
}

export default async function CustomPage({ params }: { params: { slug: string } }) {
  const page = await getPageBySlug(params.slug);
  if (!page) notFound();

  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">{page.title}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-12">
        {page.body ? (
          <div
            className="prose prose-sm max-w-none text-charcoal/70 [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_a]:text-gold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:text-brown [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:text-brown"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        ) : (
          <p className="text-charcoal/50">This page has no content yet.</p>
        )}
      </div>
    </div>
  );
}
