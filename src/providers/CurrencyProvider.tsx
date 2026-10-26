'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DEFAULT_CURRENCY,
  currencyFromProductPath,
  isStoreCurrency,
  normalizeStoreCurrency,
  withCurrencyInProductPath,
  type StoreCurrency,
} from '@/lib/fourthwall/routes';

const COOKIE_NAME = 'fw_currency';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCurrencyCookie(): StoreCurrency | null {
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  const value = match?.slice(COOKIE_NAME.length + 1).toUpperCase();
  return value && isStoreCurrency(value) ? value : null;
}

function writeCurrencyCookie(currency: StoreCurrency): void {
  document.cookie = `${COOKIE_NAME}=${currency}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

interface CurrencyContextValue {
  currency: StoreCurrency;
  setCurrency: (currency: string) => void;
}

// A safe default means components (and tests) work even without the provider.
const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => undefined,
});

/**
 * The shopper's currency. On a product page the URL decides
 * (/EUR/product/…); everywhere else the remembered choice (cookie) does.
 */
export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pathCurrency = currencyFromProductPath(pathname);
  const [stored, setStored] = useState<StoreCurrency>(DEFAULT_CURRENCY);
  // The choice made on a product page, shown straight away while the page for
  // the new currency is still loading.
  const [pending, setPending] = useState<StoreCurrency | null>(null);
  const lastPathCurrency = useRef<StoreCurrency | null>(null);

  // Restore the remembered choice after hydration.
  useEffect(() => {
    const saved = readCurrencyCookie();
    if (saved) setStored(saved);
  }, []);

  // Landing on (or moving to) a /EUR/product/… address makes EUR the
  // remembered choice, so the cart and navbar agree with the page. This only
  // reacts when the address itself changes, never while a switch is in flight.
  useEffect(() => {
    if (pathCurrency && pathCurrency !== lastPathCurrency.current) {
      lastPathCurrency.current = pathCurrency;
      writeCurrencyCookie(pathCurrency);
      setStored(pathCurrency);
    } else if (!pathCurrency) {
      lastPathCurrency.current = null;
    }
  }, [pathCurrency]);

  // Any navigation settles a pending switch.
  useEffect(() => {
    setPending(null);
  }, [pathname]);

  const setCurrency = useCallback(
    (next: string) => {
      const target = normalizeStoreCurrency(next);
      writeCurrencyCookie(target);
      setStored(target);

      // On a product page the currency is part of the address — move to it.
      if (currencyFromProductPath(window.location.pathname)) {
        setPending(target);
        router.push(
          `${withCurrencyInProductPath(window.location.pathname, target)}${window.location.search}`,
          { scroll: false }
        );
      }
    },
    [router]
  );

  const currency = pending ?? pathCurrency ?? stored;
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
