'use client';

import { useState } from 'react';
import { ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { buildFourthwallCheckoutUrl, getFourthwallStoreUrl } from '@/lib/fourthwall/checkout';
import type { FourthwallVariantAttributes } from '@/lib/fourthwall/client';

export interface SelectorVariant {
  id: string;
  name: string;
  unitPrice: { value: number; currency: string };
  attributes?: FourthwallVariantAttributes;
}

interface VariantSelectorProps {
  fourthwallId: string;
  productTitle: string;
  productImage?: string;
  variants: SelectorVariant[];
  storeUrl: string;
}

// Pulls Color / Size out of a variant when Fourthwall provides them.
// Anything else falls back to a plain list of variants by name, so an
// unexpected attribute shape can never break purchasing.
function optionsOf(variant: SelectorVariant): Record<string, string> {
  const options: Record<string, string> = {};
  const colorName = variant.attributes?.color?.name;
  const sizeName = variant.attributes?.size?.name;
  if (colorName) options['Color'] = colorName;
  if (sizeName) options['Size'] = sizeName;
  return options;
}

export default function VariantSelector({
  fourthwallId,
  productTitle,
  productImage,
  variants,
  storeUrl,
}: VariantSelectorProps) {
  const addItem = useCartStore((state) => state.addItem);
  const resolvedStoreUrl = getFourthwallStoreUrl() || storeUrl;

  const groups: Record<string, string[]> = {};
  for (const variant of variants) {
    for (const [name, value] of Object.entries(optionsOf(variant))) {
      const existing = groups[name] ?? [];
      if (!existing.includes(value)) existing.push(value);
      groups[name] = existing;
    }
  }
  const groupNames = Object.keys(groups);
  const useOptionGroups = groupNames.length > 0;

  const [selectedId, setSelectedId] = useState<string | undefined>(variants[0]?.id);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    variants[0] ? optionsOf(variants[0]) : {}
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((variant) => variant.id === selectedId);

  function chooseOption(name: string, value: string) {
    const next = { ...selectedOptions, [name]: value };
    setSelectedOptions(next);
    const match = variants.find((variant) => {
      const own = optionsOf(variant);
      return groupNames.every((group) => own[group] === next[group]);
    });
    if (match) setSelectedId(match.id);
  }

  function label(variant: SelectorVariant): string {
    return variant.attributes?.description || variant.name;
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      id: selectedVariant.id,
      variant_id: selectedVariant.id,
      fourthwall_id: fourthwallId,
      title: variants.length > 1 ? `${productTitle} — ${label(selectedVariant)}` : productTitle,
      price_cents: Math.round(selectedVariant.unitPrice.value * 100),
      quantity,
      image: productImage,
      type: 'merch',
    });
    setAdded(true);
    toast.success(`${productTitle} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!selectedVariant) return;
    const url = buildFourthwallCheckoutUrl(resolvedStoreUrl, [
      { variantId: selectedVariant.id, quantity },
    ]);
    if (!url) {
      toast.error('Checkout is not configured yet — the Fourthwall store URL is missing.');
      return;
    }
    window.location.href = url;
  }

  if (!selectedVariant) {
    return <p className="text-sm text-charcoal/50">This product is currently unavailable.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="font-serif text-3xl font-medium text-gold">
        ${selectedVariant.unitPrice.value.toFixed(2)}
      </p>

      {useOptionGroups
        ? groupNames.map((groupName) => (
            <div key={groupName}>
              <p className="mb-2 text-sm font-medium text-charcoal/70">
                {groupName}: <span className="font-normal text-charcoal">{selectedOptions[groupName]}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {(groups[groupName] ?? []).map((value) => {
                  const isActive = selectedOptions[groupName] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseOption(groupName, value)}
                      className={`rounded-brand border px-4 py-1.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'border-brown bg-brown text-cream'
                          : 'border-gold/20 bg-white text-charcoal hover:border-gold'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        : variants.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-medium text-charcoal/70">Option</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedId(variant.id)}
                    className={`rounded-brand border px-4 py-1.5 text-sm font-medium transition-all ${
                      selectedId === variant.id
                        ? 'border-brown bg-brown text-cream'
                        : 'border-gold/20 bg-white text-charcoal hover:border-gold'
                    }`}
                  >
                    {label(variant)}
                  </button>
                ))}
              </div>
            </div>
          )}

      <div>
        <p className="mb-2 text-sm font-medium text-charcoal/70">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-brand border border-gold/30 text-charcoal hover:border-gold"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-medium text-charcoal">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-brand border border-gold/30 text-charcoal hover:border-gold"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleAddToCart} className="btn-secondary flex-1 gap-2">
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </>
          )}
        </button>
        <button type="button" onClick={handleBuyNow} className="btn-primary flex-1">
          Buy Now
        </button>
      </div>

      <p className="text-center text-xs text-charcoal/40">
        You&apos;ll complete payment on Fourthwall&apos;s secure checkout.
      </p>
    </div>
  );
}
