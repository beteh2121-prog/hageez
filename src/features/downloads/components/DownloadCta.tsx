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

  // Synced from Fourthwall or Gumroad: we never hold the file. Checkout,
  // payment (if any), and delivery all happen on that platform — even for
  // a $0 item, since both platforms still run their own claim/checkout
  // flow rather than handing us a file to redirect to.
  if (download.source === 'gumroad' && download.external_url) {
    return (
      <a
        href={download.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        {download.price_cents === 0 ? 'Get on Gumroad' : `Buy on Gumroad — ${formatPrice(download.price_cents)}`}
      </a>
    );
  }

  if (download.source === 'fourthwall' && download.fourthwall_product_id) {
    return (
      <a
        href={`${storeUrl}/products/${download.fourthwall_product_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        {download.price_cents === 0
          ? 'Get on Fourthwall'
          : `Buy on Fourthwall — ${formatPrice(download.price_cents)}`}
      </a>
    );
  }

  // Manual download: we host the actual file in Supabase Storage.
  if (hasPurchased || download.price_cents === 0) {
    return (
      <a
        href={`/api/downloads/free?download_id=${download.id}`}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        {hasPurchased ? 'Download Again' : 'Download Free'}
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={`${storeUrl}/products/${download.fourthwall_product_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        Buy on Fourthwall — {formatPrice(download.price_cents)}
      </a>
      <p className="text-sm text-charcoal/50">You will receive a download link by email after purchase.</p>
    </div>
  );
}
