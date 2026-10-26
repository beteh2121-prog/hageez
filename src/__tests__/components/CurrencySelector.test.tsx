import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CurrencyProvider from '@/providers/CurrencyProvider';
import CurrencySelector from '@/components/layout/CurrencySelector';

const push = vi.fn();
let pathname = '/USD/product/launch-t-shirt';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push }),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderSelector() {
  return render(
    <CurrencyProvider>
      <CurrencySelector />
    </CurrencyProvider>
  );
}

function openMenu() {
  const trigger = screen.getByRole('button', { name: /Currency:/ });
  fireEvent.keyDown(trigger, { key: 'Enter' });
}

describe('CurrencySelector', () => {
  beforeEach(() => {
    push.mockReset();
    pathname = '/USD/product/launch-t-shirt';
    document.cookie = 'fw_currency=; path=/; max-age=0';
    window.history.replaceState(null, '', '/USD/product/launch-t-shirt?color=Terracotta&size=M');
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the current currency and lists all six', () => {
    renderSelector();
    expect(screen.getByRole('button', { name: 'Currency: USD' })).toBeTruthy();
    openMenu();
    for (const code of ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']) {
      expect(screen.getByRole('menuitem', { name: code })).toBeTruthy();
    }
  });

  it('moves a product page to the chosen currency and keeps colour and size', () => {
    renderSelector();
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'EUR' }));
    expect(push).toHaveBeenCalledWith('/EUR/product/launch-t-shirt?color=Terracotta&size=M', { scroll: false });
    expect(document.cookie).toContain('fw_currency=EUR');
    // The new currency shows immediately, before the page has finished loading.
    expect(screen.getByRole('button', { name: 'Currency: EUR' })).toBeTruthy();
  });

  it('on other pages it just remembers the choice', () => {
    pathname = '/shop';
    window.history.replaceState(null, '', '/shop');
    renderSelector();
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'GBP' }));
    expect(push).not.toHaveBeenCalled();
    expect(document.cookie).toContain('fw_currency=GBP');
    expect(screen.getByRole('button', { name: 'Currency: GBP' })).toBeTruthy();
  });

  it('follows the currency in the page address', () => {
    pathname = '/JPY/product/launch-t-shirt';
    renderSelector();
    expect(screen.getByRole('button', { name: 'Currency: JPY' })).toBeTruthy();
  });
});
