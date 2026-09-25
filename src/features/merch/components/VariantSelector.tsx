'use client';

import { useState } from 'react';
import { ShoppingBag, Loader2, Check, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';

interface Variant {
  id: string;
  name: string;
  unitPrice: { value: number; currency: string };
  attributes?: { name: string; value: string }[];
}

interface VariantSelectorProps {
  productId: string;
  productDbId: string;
  productTitle: string;
  productImage?: string;
  variants: Variant[];
}

export default function VariantSelector({
  productId,
  productDbId,
  productTitle,
  productImage,
  variants,
}: VariantSelectorProps) {
  const addItem = useCartStore((state) => state.addItem);

  // useState initialiser cannot accept null — use undefined + first element
  const firstVariant = variants[0];
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(firstVariant);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Build attribute groups from all variants (e.g. Color, Size)
  const attributeGroups: Record<string, string[]> = {};
  variants.forEach((v) => {
    v.attributes?.forEach((attr) => {
      if (!attributeGroups[attr.name]) attributeGroups[attr.name] = [];
      const existing = attributeGroups[attr.name];
      if (existing && !existing.includes(attr.value)) {
        existing.push(attr.value);
      }
    });
  });

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    firstVariant?.attributes?.forEach((a) => {
      defaults[a.name] = a.value;
    });
    return defaults;
  });

  function selectAttribute(name: string, value: string) {
    const updated = { ...selectedAttrs, [name]: value };
    setSelectedAttrs(updated);
    const match = variants.find((v) =>
      v.attributes?.every((a) => updated[a.name] === a.value)
    );
    if (match) setSelectedVariant(match);
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      id: productDbId,
      fourthwall_id: productId,
      title:
        productTitle +
        (selectedVariant.name !== 'Default' ? ` — ${selectedVariant.name}` : ''),
      price_cents: Math.round(selectedVariant.unitPrice.value * 100),
      quantity,
      image: productImage,
      type: 'merch',
    });
    setAdded(true);
    toast.success(`${productTitle} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  }

  async function handleBuyNow() {
    if (!selectedVariant) return;
    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ fourthwall_id: productId, quantity }],
        }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error ?? 'Could not start checkout');
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      toast.error('Could not reach checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  }

  const price = selectedVariant
    ? `$${selectedVariant.unitPrice.value.toFixed(2)}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      {price && (
        <p className="font-serif text-3xl font-medium text-gold">{price}</p>
      )}

      {/* Variant attributes (Color, Size, etc.) */}
      {Object.entries(attributeGroups).map(([attrName, values]) => (
        <div key={attrName}>
          <p className="mb-2 text-sm font-medium text-charcoal/70">
            {attrName}:{' '}
            <span className="font-normal text-charcoal">{selectedAttrs[attrName]}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const isActive = selectedAttrs[attrName] === value;
              const isColor = attrName.toLowerCase() === 'color';
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectAttribute(attrName, value)}
                  className={
                    isColor
                      ? `h-8 min-w-[2rem] rounded-full border-2 px-3 text-xs font-medium transition-all ${
                          isActive
                            ? 'border-gold bg-gold text-brown-dark'
                            : 'border-gold/20 bg-cream-dark text-charcoal hover:border-gold/50'
                        }`
                      : `rounded-[4px] border px-4 py-1.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'border-brown bg-brown text-cream'
                            : 'border-gold/20 bg-white text-charcoal hover:border-gold'
                        }`
                  }
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div>
        <p className="mb-2 text-sm font-medium text-charcoal/70">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-gold/30 text-charcoal hover:border-gold"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-medium text-charcoal">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-gold/30 text-charcoal hover:border-gold"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant}
          className="btn-secondary inline-flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
        >
          {added ? (
            <><Check className="h-4 w-4" /> Added to Cart</>
          ) : (
            <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
          )}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={checkingOut || !selectedVariant}
          className="btn-primary inline-flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
        >
          {checkingOut ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
          ) : (
            'Buy Now'
          )}
        </button>
      </div>

      <p className="text-center text-xs text-charcoal/40">
        Secure checkout powered by Fourthwall
      </p>
    </div>
  );
}
