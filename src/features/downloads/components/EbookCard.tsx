import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import type { Download } from '@/types';
import { formatPrice } from '@/lib/utils/formatPrice';

interface EbookCardProps {
  ebook: Download;
}

export default function EbookCard({ ebook }: EbookCardProps) {
  return (
    <Link href={`/downloads/${ebook.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-brand-md bg-cream-dark shadow-gold-sm transition-shadow group-hover:shadow-gold-md">
        {ebook.cover_path ? (
          <Image
            src={ebook.cover_path}
            alt={ebook.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brown-light to-gold-dark">
            <BookOpen className="h-10 w-10 text-cream/50" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-brown transition-colors group-hover:text-gold">
          {ebook.title}
        </h3>
        <p className="mt-1.5">
          {ebook.price_cents === 0 ? (
            <span className="badge-free">Free</span>
          ) : (
            <span className="price-text text-sm">{formatPrice(ebook.price_cents)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
