import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { Merch } from '@/types';
import { productPath } from '@/lib/fourthwall/routes';
import { formatPrice } from '@/lib/utils/formatPrice';

interface MerchCardProps {
  product: Merch;
}

export default function MerchCard({ product }: MerchCardProps) {
  const image = product.images[0];

  return (
    <Link
      href={productPath(product.slug)}
      className="group block overflow-hidden rounded-brand-md border border-gold/10 bg-white shadow-gold-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-gold-md"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gold/30" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 font-serif text-sm font-semibold text-brown">{product.title}</h3>
        <p className="mt-1 text-sm font-medium text-gold">
          {formatPrice(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
