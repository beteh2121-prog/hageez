import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { FourthwallStorefrontProduct } from '@/lib/fourthwall/client';
import { buildProductView } from '@/lib/fourthwall/product-view';
import ProductExperience from '@/features/merch/components/ProductExperience';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function variant(id: string, color: string, size: string, inStock?: number) {
  return {
    id,
    name: `Tee ${color} ${size}`,
    unitPrice: { value: color === 'Terracotta' ? 30 : 25, currency: 'USD' },
    attributes: { description: `${color}, ${size}`, color: { name: color, swatch: '#aa5533' }, size: { name: size } },
    images: [{ id: `${id}i`, url: `https://img/${color}-${size}.png` }],
    stock: inStock === undefined ? { type: 'UNLIMITED' } : { type: 'LIMITED', inStock },
  };
}

const product: FourthwallStorefrontProduct = {
  id: 'p1',
  name: 'Launch T-Shirt',
  slug: 'launch-t-shirt',
  images: [{ id: 'm', url: 'https://img/main.png' }],
  variants: [variant('var-black-s', 'Black', 'S'), variant('var-black-m', 'Black', 'M'), variant('var-terra-s', 'Terracotta', 'S', 4), variant('var-terra-m', 'Terracotta', 'M')],
};

function renderPage(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ProductExperience', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.history.replaceState(null, '', '/USD/product/launch-t-shirt');
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'c1', lines: [], totalQuantity: 1, subtotalCents: 3000, currency: 'USD' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows colour, size and quantity controls on the page', () => {
    renderPage(<ProductExperience view={buildProductView(product)} description={null} />);
    expect(screen.getByRole('radiogroup', { name: 'Color' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Size' })).toBeTruthy();
    expect(screen.getByLabelText('Increase quantity')).toBeTruthy();
    expect(screen.getByText('$25.00')).toBeTruthy();
  });

  it('puts the chosen colour and size in the address bar without leaving the page', () => {
    renderPage(<ProductExperience view={buildProductView(product)} description={null} />);

    fireEvent.click(screen.getByRole('radio', { name: /Terracotta/ }));
    expect(window.location.pathname).toBe('/USD/product/launch-t-shirt');
    expect(new URLSearchParams(window.location.search).get('color')).toBe('Terracotta');
    expect(screen.getByText('$30.00')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'S' }));
    expect(new URLSearchParams(window.location.search).get('size')).toBe('S');
  });

  it('opens on the variant named in a shared link', () => {
    window.history.replaceState(null, '', '/USD/product/launch-t-shirt?color=Terracotta&size=S');
    renderPage(<ProductExperience view={buildProductView(product)} description={null} />);
    expect(screen.getByRole('radio', { name: /Terracotta/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'S' }).getAttribute('aria-checked')).toBe('true');
  });

  it('adds the selected variant and quantity to the cart', async () => {
    renderPage(<ProductExperience view={buildProductView(product)} description={null} />);

    fireEvent.click(screen.getByRole('radio', { name: /Terracotta/ }));
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    fireEvent.click(screen.getByRole('button', { name: /Add to Cart/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/cart');
    expect(JSON.parse(String(init.body))).toEqual({ action: 'add', variantId: 'var-terra-s', quantity: 3 });
  });

  it('caps quantity at the remaining stock', () => {
    window.history.replaceState(null, '', '/USD/product/launch-t-shirt?color=Terracotta&size=S');
    renderPage(<ProductExperience view={buildProductView(product)} description={null} />);

    const increase = screen.getByLabelText('Increase quantity') as HTMLButtonElement;
    for (let i = 0; i < 10; i++) fireEvent.click(increase);
    expect(screen.getByText('4')).toBeTruthy();
    expect(increase.disabled).toBe(true);
    expect(screen.getByText('Only 4 left in stock.')).toBeTruthy();
  });
});
