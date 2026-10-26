import Link from 'next/link';
import Image from 'next/image';
import type { Merch } from '@/types';
import { productPath } from '@/lib/fourthwall/routes';
import PriceTag from '@/components/shared/PriceTag';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ product }: { product: Merch }) {
  const image = product.images[0];

  return (
    <Link
      href={productPath(product.slug)}
      className="group flex flex-col overflow-hidden rounded-brand-md border border-gold/10 bg-white shadow-gold-sm transition-shadow hover:shadow-gold-md"
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-cream-dark">
            <ShoppingBag className="h-12 w-12 text-gold/30" />
          </div>
        )}
      </div>

      {/* Details area */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-serif text-lg leading-snug text-brown">{product.title}</h3>
        <PriceTag cents={product.price_cents} currency={product.currency} />
        {product.description && (
          <p className="line-clamp-2 text-sm text-charcoal/60">{product.description}</p>
        )}
        <div className="mt-auto pt-2">
          <span className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4" />
            View Product
          </span>
        </div>
      </div>
    </Link>
  );
}
