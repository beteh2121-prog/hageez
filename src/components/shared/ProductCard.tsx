import Link from 'next/link';
import Image from 'next/image';
import type { Merch } from '@/types';
import PriceTag from '@/components/shared/PriceTag';

export default function ProductCard({ product }: { product: Merch }) {
  const image = product.images[0];

  return (
    <Link
      href={`/shop/${product.id}`}
      className="group overflow-hidden rounded-brand-md border border-gold/10 bg-white shadow-gold-sm transition-shadow hover:shadow-gold-md"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        {image && (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-serif text-lg text-brown">{product.title}</h3>
        <PriceTag cents={product.price_cents} currency={product.currency} />
      </div>
    </Link>
  );
}
