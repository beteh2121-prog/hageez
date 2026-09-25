import type { Metadata } from 'next';
import { createStaticClient } from '@/lib/supabase/static';
import SectionHeader from '@/components/shared/SectionHeader';
import EbooksBrowser from '@/features/downloads/components/EbooksBrowser';
import type { Download } from '@/types';

export const revalidate = 1800;
export const metadata: Metadata = {
  title: 'Ebooks',
  description: 'Digital ebooks — instant delivery via Gumroad.',
};

async function getEbooks(): Promise<Download[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('downloads')
    .select('*')
    .eq('source', 'gumroad')
    .order('created_at', { ascending: false });
  return (data ?? []) as Download[];
}

export default async function EbooksPage() {
  const ebooks = await getEbooks();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeader
        label="Digital Library"
        title="eBooks"
        subtitle="Download PDF and ePub editions. Free and premium titles available directly."
        className="mb-10"
      />

      <EbooksBrowser ebooks={ebooks} />
    </div>
  );
}
