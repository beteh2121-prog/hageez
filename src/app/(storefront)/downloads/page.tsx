import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, BookOpen, Music, Video, ExternalLink } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import PriceTag from '@/components/shared/PriceTag';
import EmptyState from '@/components/shared/EmptyState';
import type { Download } from '@/types';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Downloads',
  description: 'Digital downloads — PDFs, ebooks, audio, and more.',
};

const FILE_ICONS = {
  pdf: FileText,
  epub: BookOpen,
  mp3: Music,
  video: Video,
};

const SOURCE_LABELS: Record<string, string> = {
  fourthwall: 'Fourthwall',
  gumroad: 'Gumroad',
  manual: '',
};

async function getDownloads(): Promise<Download[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('downloads')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as Download[];
}

export default async function DownloadsPage() {
  const downloads = await getDownloads();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-serif text-3xl text-brown sm:text-4xl">Downloads</h1>
      <p className="mt-2 text-charcoal/60">{downloads.length} digital item(s)</p>

      {downloads.length === 0 ? (
        <EmptyState message="No downloads available yet." />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.map((download) => {
            const Icon = download.file_type ? FILE_ICONS[download.file_type] : FileText;
            const sourceLabel = SOURCE_LABELS[download.source] ?? '';

            return (
              <Link
                key={download.id}
                href={`/downloads/${download.slug}`}
                className="group flex flex-col overflow-hidden rounded-brand-md border border-gold/10 bg-white shadow-gold-sm transition-shadow hover:shadow-gold-md"
              >
                {/* Cover image or icon placeholder */}
                <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
                  {download.cover_path ? (
                    <Image
                      src={download.cover_path}
                      alt={download.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon className="h-16 w-16 text-gold/30" />
                    </div>
                  )}

                  {/* Source badge */}
                  {sourceLabel && (
                    <span className="absolute right-2 top-2 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-medium text-brown">
                      {sourceLabel}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <h3 className="font-serif text-base leading-snug text-brown">{download.title}</h3>
                  </div>

                  {download.description && (
                    <p className="line-clamp-2 text-sm text-charcoal/60">{download.description}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <PriceTag cents={download.price_cents} />
                    {download.source !== 'manual' && (
                      <ExternalLink className="h-3.5 w-3.5 text-charcoal/30" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
