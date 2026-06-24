import { formatPrice } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';

interface PriceTagProps {
  cents: number;
  currency?: string;
  free?: boolean;
}

export default function PriceTag({ cents, currency = 'USD', free = false }: PriceTagProps) {
  const isFree = free || cents === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
        isFree ? 'bg-green-100 text-green-700' : 'bg-gold/10 text-gold-dark'
      )}
    >
      {isFree ? 'Free' : formatPrice(cents, currency)}
    </span>
  );
}
