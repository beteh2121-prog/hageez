import type { Metadata } from 'next';
import { createStaticClient } from '@/lib/supabase/static';
import SectionHeader from '@/components/shared/SectionHeader';
import BooksBrowser from '@/features/books/components/BooksBrowser';
import type { KdpBook } from '@/types';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Books',
  description: 'Curated Ethiopian Orthodox theology and literature — KDP titles on Amazon.',
};

async function getBooks(): Promise<KdpBook[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('kdp_books')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return (data ?? []) as KdpBook[];
}

export default async function BooksPage() {
  const books = await getBooks();
  const categories = Array.from(new Set(books.flatMap((b) => b.categories))).sort();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeader
        label="Amazon KDP Affiliate"
        title="Physical Books"
        subtitle="Curated Ethiopian Orthodox books available on Amazon. Purchasing through our links supports this ministry."
        className="mb-10"
      />

      <BooksBrowser books={books} categories={categories} />

      <p className="mt-12 text-center text-xs text-charcoal/35">
        As an Amazon Associate I earn from qualifying purchases.
      </p>
    </div>
  );
}
