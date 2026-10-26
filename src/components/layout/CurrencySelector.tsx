'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useCurrency } from '@/providers/CurrencyProvider';
import { STORE_CURRENCIES } from '@/lib/fourthwall/routes';

/** USD / EUR / GBP / CAD / AUD / JPY. On a product page this moves to /EUR/product/…. */
export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Currency: ${currency}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-brand-md border border-white/15 bg-white/5 px-3 text-sm font-medium text-cream/80 transition-colors hover:border-gold hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {currency}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[70] min-w-[9rem] rounded-md bg-white p-1 text-charcoal shadow-lg ring-1 ring-black/5"
        >
          {STORE_CURRENCIES.map((code) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => setCurrency(code)}
              className="flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-cream-dark"
            >
              {code}
              {code === currency && <Check className="h-4 w-4 text-gold" aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
