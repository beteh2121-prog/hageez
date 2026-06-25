'use client';

import { ExternalLink } from 'lucide-react';
import type { KdpBook } from '@/types';
import { buildBookAffiliateUrl } from '@/features/books/utils/buildBookAffiliateUrl';
import { useTrackClick } from '@/hooks/useAffiliateTracking';
import { cn } from '@/lib/utils/cn';

interface AffiliateButtonProps {
  book: KdpBook;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-sm py-1.5 px-3',
  md: 'text-sm py-2.5 px-5',
  lg: 'text-base py-3 px-7',
};

export default function AffiliateButton({ book, size = 'md', fullWidth = false }: AffiliateButtonProps) {
  const { trackClick } = useTrackClick();
  const href = buildBookAffiliateUrl(book);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      onClick={() => trackClick(book.id, book.marketplace)}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-brand bg-gold font-medium text-brown transition-colors hover:bg-gold-dark',
        SIZE_CLASSES[size],
        fullWidth && 'w-full'
      )}
    >
      Buy on Amazon
      {book.price_usd !== null && <span>— ${book.price_usd.toFixed(2)}</span>}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}
