'use client';

import { ExternalLink, FileText, BookOpen, Music, Video } from 'lucide-react';
import type { Download } from '@/types';
import { useSession } from '@/hooks/useAuth';
import { useUserPurchases } from '@/hooks/useDownloads';
import { formatPrice } from '@/lib/utils/formatPrice';

const FILE_ICONS = { pdf: FileText, epub: BookOpen, mp3: Music, video: Video };

interface DownloadCtaProps {
  download: Download;
  storeUrl: string;
}

export default function DownloadCta({ download, storeUrl }: DownloadCtaProps) {
  const { data: session } = useSession();
  const { data: purchasedIds } = useUserPurchases();

  const Icon = download.file_type ? FILE_ICONS[download.file_type] : ExternalLink;
  const hasPurchased = !!session && !!purchasedIds?.includes(download.id);

  // GUMROAD: link directly to Gumroad for purchase and delivery
  if (download.source === 'gumroad') {
    const url = download.external_url;
    if (!url) {
      return <p className="text-sm text-charcoal/50">This product is currently unavailable.</p>;
    }
    return (
      <div className="flex flex-col gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          {download.price_cents === 0
            ? 'Get for Free on Gumroad'
            : 'Buy on Gumroad — ' + formatPrice(download.price_cents)}
        </a>
        <p className="text-xs text-charcoal/40">
          You will be taken to Gumroad to complete your purchase.
        </p>
      </div>
    );
  }

  // MANUAL free or already purchased: deliver via our signed Supabase URL
  if (hasPurchased || download.price_cents === 0) {
    return (
      <a
        href={'/api/downloads/free?download_id=' + download.id}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        {hasPurchased ? 'Download Again' : 'Download Free'}
      </a>
    );
  }

  // MANUAL paid: buy via Fourthwall, we email the file after payment
  return (
    <div className="flex flex-col gap-2">
      <a
        href={storeUrl + '/products/' + (download.fourthwall_product_id ?? '')}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        {'Buy — ' + formatPrice(download.price_cents)}
      </a>
      <p className="text-sm text-charcoal/50">
        You will receive a download link by email after purchase.
      </p>
    </div>
  );
}
