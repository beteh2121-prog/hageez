import type { Metadata } from 'next';
import { createStaticClient } from '@/lib/supabase/static';
import SectionHeader from '@/components/shared/SectionHeader';
import DownloadsBrowser from '@/features/downloads/components/DownloadsBrowser';
import type { Download } from '@/types';

export const revalidate = 1800;
export const metadata: Metadata = {
  title: 'Downloads',
  description: 'Free and paid digital resources — prayers, guides, liturgical texts.',
};

async function getDownloads(): Promise<Download[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('downloads')
    .select('*')
    .order('price_cents', { ascending: true })
    .order('created_at', { ascending: false });
  return (data ?? []) as Download[];
}

export default async function DownloadsPage() {
  const downloads = await getDownloads();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeader
        label="Digital Library"
        title="Free Resources & Downloads"
        subtitle="Prayers, liturgical guides, calendars, study materials and more — free and premium digital resources."
        className="mb-10"
      />

      <DownloadsBrowser downloads={downloads} />
    </div>
  );
}
