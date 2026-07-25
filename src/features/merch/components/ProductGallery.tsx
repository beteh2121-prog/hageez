'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  url: string;
  alt: string;
}

export default function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-[8px] bg-cream-dark flex items-center justify-center">
        <span className="text-7xl">✝</span>
      </div>
    );
  }

  const primaryImage = images[selected] ?? images[0];
  const primaryUrl = primaryImage?.url ?? images[0]?.url ?? '';
  const primaryAlt = primaryImage?.alt ?? title;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[8px] bg-cream-dark">
        <Image
          src={primaryUrl}
          alt={primaryAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative aspect-square overflow-hidden rounded-[6px] border-2 transition-colors ${
                selected === i ? 'border-gold' : 'border-transparent hover:border-gold/40'
              }`}
            >
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
