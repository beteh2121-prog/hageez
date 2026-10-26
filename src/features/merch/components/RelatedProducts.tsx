import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { productPath } from '@/lib/fourthwall/routes';
import type { RelatedProduct } from '@/lib/fourthwall/related';
import { formatPriceWithCode } from '@/lib/utils/formatPrice';

/** "Related products" grid under a product. Links keep the shopper's currency. */
export default function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-20" aria-labelledby="related-products-heading">
      <h2 id="related-products-heading" className="mb-6 font-serif text-2xl text-brown">
        Related products
      </h2>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={productPath(product.slug, product.currency)}
            className="group block overflow-hidden rounded-brand-md border border-gold/10 bg-white shadow-gold-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-gold-md"
          >
            <div className="relative aspect-square overflow-hidden bg-cream-dark">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-gold/30" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 font-serif text-sm font-semibold text-brown">{product.name}</h3>
              <p className="mt-1 text-sm font-medium text-gold">
                {product.hasPriceRange && <span className="mr-1 font-normal text-charcoal/50">From</span>}
                {formatPriceWithCode(product.priceCents, product.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
