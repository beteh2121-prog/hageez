import Link from 'next/link';
import Image from 'next/image';
import { FileText, BookOpen, Music, Video, ExternalLink } from 'lucide-react';
import type { Download } from '@/types';
import { formatPrice } from '@/lib/utils/formatPrice';

interface DownloadCardProps {
  item: Download;
}

const FILE_ICONS = {
  pdf: FileText,
  epub: BookOpen,
  mp3: Music,
  video: Video,
};

export default function DownloadCard({ item }: DownloadCardProps) {
  const Icon = item.file_type ? FILE_ICONS[item.file_type] : FileText;

  return (
    <Link
      href={`/downloads/${item.slug}`}
      className="group flex gap-4 rounded-brand-md border border-gold/10 bg-white p-4 transition-colors hover:border-gold/30"
    >
      <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-brand bg-gradient-to-br from-gold to-gold-dark">
        {item.cover_path ? (
          <Image src={item.cover_path} alt={item.title} fill className="object-cover" sizes="56px" />
        ) : (
          <Icon className="h-6 w-6 text-cream" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-sm font-semibold text-brown transition-colors group-hover:text-gold">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-charcoal/55">{item.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {item.file_type && (
            <span className="rounded-full bg-cream-dark px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-charcoal/60">
              {item.file_type}
            </span>
          )}
          {item.source === 'gumroad' && (
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-gold-dark">
              Gumroad
            </span>
          )}
          {item.price_cents === 0 ? (
            <span className="badge-free">Free</span>
          ) : (
            <span className="price-text text-sm">{formatPrice(item.price_cents)}</span>
          )}
        </div>
      </div>

      {item.source !== 'manual' && (
        <ExternalLink className="h-4 w-4 flex-shrink-0 self-center text-charcoal/25" />
      )}
    </Link>
  );
}
