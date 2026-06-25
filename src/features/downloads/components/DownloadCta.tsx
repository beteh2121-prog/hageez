'use client';

import { FileText, BookOpen, Music, Video } from 'lucide-react';
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

  const Icon = FILE_ICONS[download.file_type];
  const hasPurchased = !!session && !!purchasedIds?.includes(download.id);

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
