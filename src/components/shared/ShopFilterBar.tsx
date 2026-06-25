import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface ShopFilterBarProps {
  tags: string[];
  activeTag?: string;
}

export default function ShopFilterBar({ tags, activeTag }: ShopFilterBarProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link
        href="/shop"
        className={cn(
          'rounded-full px-4 py-1.5 text-sm',
          !activeTag ? 'bg-brown text-cream' : 'bg-cream-dark text-charcoal/70 hover:bg-gold/20'
        )}
      >
        All
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/shop?tag=${encodeURIComponent(tag)}`}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm',
            activeTag === tag ? 'bg-brown text-cream' : 'bg-cream-dark text-charcoal/70 hover:bg-gold/20'
          )}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
