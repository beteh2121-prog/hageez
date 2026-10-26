'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCartMutation, useCheckout } from '@/hooks/useCart';
import { formatPriceWithCode } from '@/lib/utils/formatPrice';
import { useCartDrawer } from '@/store/cartDrawerStore';
import type { ProductView } from '@/lib/fourthwall/product-view';
import {
  buildSearch,
  defaultSelection,
  isValueAvailable,
  parseSelection,
  resolveVariant,
  selectableOptions,
  selectOption,
  type Selection,
} from '@/lib/fourthwall/selection';
import ProductImages from '@/features/merch/components/ProductImages';

interface ProductExperienceProps {
  view: ProductView;
  /** Server-rendered description, passed through so it stays in the page HTML. */
  description: ReactNode;
}

/**
 * Gallery + Color / Size / Quantity + Add to cart / Buy now, all without
 * leaving the page. The chosen options live in the URL
 * (?color=Terracotta&size=M) so a link always opens the same variant.
 */
export default function ProductExperience({ view, description }: ProductExperienceProps) {
  const openCart = useCartDrawer((state) => state.open);
  const cartMutation = useCartMutation();
  const checkout = useCheckout();

  const [selection, setSelection] = useState<Selection>(() => defaultSelection(view));
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // A shared link like ?color=Terracotta&size=M opens on that variant.
  useEffect(() => {
    const fromUrl = parseSelection(view, window.location.search);
    setSelection(fromUrl.selection);
    setImageIndex(fromUrl.image);
  }, [view]);

  const variant = resolveVariant(view, selection);
  const images = variant && variant.images.length > 0 ? variant.images : view.images;
  const options = selectableOptions(view);

  const maxQuantity = variant?.maxQuantity ?? 1;
  const effectiveQuantity = Math.min(Math.max(1, quantity), maxQuantity);
  const canBuy = Boolean(variant?.available);

  function commit(nextSelection: Selection, nextImage: number) {
    setSelection(nextSelection);
    setImageIndex(nextImage);
    // Updates the address bar in place — no navigation, no reload.
    const search = buildSearch(window.location.search, view, nextSelection, nextImage);
    window.history.replaceState(null, '', `${window.location.pathname}${search}`);
  }

  function chooseOption(key: string, value: string) {
    commit(selectOption(view, selection, key, value), 0);
  }

  function handleAddToCart() {
    if (!variant || !canBuy) return;
    cartMutation.mutate(
      { action: 'add', variantId: variant.id, quantity: effectiveQuantity },
      {
        onSuccess: () => {
          setAdded(true);
          openCart();
          setTimeout(() => setAdded(false), 2000);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  function handleBuyNow() {
    if (!variant || !canBuy) return;
    checkout.mutate(
      { variantId: variant.id, quantity: effectiveQuantity },
      { onError: (error) => toast.error(error.message) }
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ProductImages images={images} index={imageIndex} onSelect={(i) => commit(selection, i)} title={view.name} />

      <div className="flex flex-col gap-5">
        <h1 className="font-serif text-3xl font-medium text-brown">{view.name}</h1>

        {variant && (
          <p className="flex items-baseline gap-3 font-serif text-3xl font-medium text-gold">
            {formatPriceWithCode(Math.round(variant.price * 100), view.currency)}
            {variant.compareAtPrice !== null && (
              <span className="text-lg font-normal text-charcoal/40 line-through">
                {formatPriceWithCode(Math.round(variant.compareAtPrice * 100), view.currency)}
              </span>
            )}
          </p>
        )}

        {options.map((option) => (
          <div key={option.key} role="radiogroup" aria-label={option.name}>
            <p className="mb-2 text-sm font-medium text-charcoal/70">
              {option.name}: <span className="font-normal text-charcoal">{selection[option.key]}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((entry) => {
                const isActive = selection[option.key] === entry.value;
                const enabled = isValueAvailable(view, option.key, entry.value);

                return (
                  <button
                    key={entry.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    disabled={!enabled}
                    onClick={() => chooseOption(option.key, entry.value)}
                    title={enabled ? `${option.name}: ${entry.value}` : `${entry.value} (out of stock)`}
                    className={`inline-flex min-w-[48px] items-center justify-center gap-2 rounded-brand border px-4 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'border-brown bg-brown text-cream'
                        : enabled
                          ? 'border-gold/20 bg-white text-charcoal hover:border-gold'
                          : 'cursor-not-allowed border-charcoal/10 bg-cream-dark text-charcoal/35 line-through'
                    }`}
                  >
                    {entry.swatch && (
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/15"
                        style={{ backgroundColor: entry.swatch }}
                        aria-hidden="true"
                      />
                    )}
                    {entry.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-2 text-sm font-medium text-charcoal/70">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, effectiveQuantity - 1))}
              disabled={effectiveQuantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-brand border border-gold/30 text-charcoal hover:border-gold disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium text-charcoal" aria-live="polite">
              {effectiveQuantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQuantity, effectiveQuantity + 1))}
              disabled={effectiveQuantity >= maxQuantity}
              className="flex h-9 w-9 items-center justify-center rounded-brand border border-gold/30 text-charcoal hover:border-gold disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {variant?.lowStock != null && (
            <p className="mt-2 text-xs text-crimson">Only {variant.lowStock} left in stock.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canBuy || cartMutation.isPending}
            className="btn-secondary flex-1 gap-2 disabled:opacity-60"
          >
            {cartMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding…
              </>
            ) : added ? (
              <>
                <Check className="h-4 w-4" /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" /> {canBuy ? 'Add to Cart' : 'Out of stock'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canBuy || checkout.isPending || checkout.isSuccess}
            className="btn-primary inline-flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
          >
            {checkout.isPending || checkout.isSuccess ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading checkout…
              </>
            ) : (
              'Buy Now'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-charcoal/40">
          You&apos;ll complete payment on Fourthwall&apos;s secure checkout.
        </p>

        {description}
      </div>
    </div>
  );
}
