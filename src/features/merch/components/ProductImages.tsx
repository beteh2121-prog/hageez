'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import type { ImageView } from '@/lib/fourthwall/product-view';

interface ProductImagesProps {
  images: ImageView[];
  index: number;
  onSelect: (index: number) => void;
  title: string;
}

/** Controlled gallery: the parent owns the index so it can live in the URL. */
export default function ProductImages({ images, index, onSelect, title }: ProductImagesProps) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[8px] bg-cream-dark">
        <ShoppingBag className="h-16 w-16 text-gold/30" />
      </div>
    );
  }

  const safeIndex = Math.min(Math.max(0, index), images.length - 1);
  const current = images[safeIndex] ?? images[0];
  const previous = safeIndex === 0 ? images.length - 1 : safeIndex - 1;
  const next = safeIndex + 1 < images.length ? safeIndex + 1 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[8px] bg-cream-dark">
        {current && (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || title}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        )}

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div className="flex h-10 items-center rounded-full border border-white/60 bg-cream/85 text-brown backdrop-blur">
              <button
                type="button"
                onClick={() => onSelect(previous)}
                aria-label="Previous product image"
                className="flex h-full items-center px-4 transition-transform hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="h-5 w-px bg-brown/30" aria-hidden="true" />
              <button
                type="button"
                onClick={() => onSelect(next)}
                aria-label="Next product image"
                className="flex h-full items-center px-4 transition-transform hover:scale-110"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.slice(0, 10).map((image, i) => (
            <li key={`${image.url}-${i}`}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === safeIndex}
                className={`relative block aspect-square w-full overflow-hidden rounded-[6px] border-2 transition-colors ${
                  i === safeIndex ? 'border-gold' : 'border-transparent hover:border-gold/40'
                }`}
              >
                <Image src={image.url} alt={image.alt || title} fill className="object-cover" sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
