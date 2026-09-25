import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import type { KdpBook } from '@/types';

interface BookCardProps {
  book: KdpBook;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.asin}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-brand-md bg-cream-dark shadow-gold-sm transition-shadow group-hover:shadow-gold-md">
        {book.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brown to-brown-light">
            <BookOpen className="h-10 w-10 text-gold/40" />
          </div>
        )}
        {book.is_featured && (
          <span className="absolute right-2 top-2 rounded-brand bg-gold px-2 py-0.5 text-[10px] font-medium text-cream">
            Featured
          </span>
        )}
      </div>

      <div className="mt-3">
        {book.categories[0] && (
          <p className="text-[11px] uppercase tracking-wide text-gold">{book.categories[0]}</p>
        )}
        <h3 className="mt-1 line-clamp-2 font-serif text-sm font-semibold leading-snug text-brown group-hover:text-gold transition-colors">
          {book.title}
        </h3>
        <p className="mt-1 text-xs text-charcoal/50">{book.author}</p>
        <p className="mt-1.5 text-sm font-medium text-gold">
          {book.price_usd ? `$${book.price_usd.toFixed(2)}` : 'On Amazon'}
        </p>
      </div>
    </Link>
  );
}
