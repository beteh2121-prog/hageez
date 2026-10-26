import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CartPanel from '@/components/cart/CartPanel';
import type { CartView } from '@/lib/fourthwall/cart-types';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const cart: CartView = {
  id: 'c1',
  currency: 'USD',
  totalQuantity: 2,
  subtotalCents: 5000,
  lines: [
    { variantId: 'var-violet-l', productId: 'p', productSlug: 'launch-t-shirt', productName: 'Launch t-shirt', variantLabel: 'Violet, L', quantity: 1, unitPriceCents: 2500, imageUrl: 'https://img/violet.png', stockLimit: null },
    { variantId: 'var-blue-l', productId: 'p', productSlug: 'launch-t-shirt', productName: 'Launch t-shirt', variantLabel: 'Lagoon Blue, L', quantity: 1, unitPriceCents: 2500, imageUrl: 'https://img/blue.png', stockLimit: null },
  ],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('CartPanel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.startsWith('/api/cart/checkout')) return json({ checkoutUrl: 'https://shop.example.com/cart/checkout?cartId=c1&currency=USD' });
      if (init?.method === 'POST') return json({ ...cart, lines: cart.lines.slice(1), totalQuantity: 1, subtotalCents: 2500 });
      return json(cart);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  function renderPanel() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <CartPanel variant="drawer" />
      </QueryClientProvider>
    );
  }

  it('lists items with variant, price and quantity, then taxes, shipping and total', async () => {
    renderPanel();
    expect(await screen.findByText('Violet, L')).toBeTruthy();
    expect(screen.getByText('Lagoon Blue, L')).toBeTruthy();
    expect(screen.getAllByText('$25.00 USD')).toHaveLength(2);
    expect(screen.getByText('Taxes')).toBeTruthy();
    expect(screen.getByText('Shipping')).toBeTruthy();
    expect(screen.getAllByText('Calculated at checkout')).toHaveLength(2);
    expect(screen.getByText('$50.00 USD')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeTruthy();
  });

  it('removes an item with the small x button', async () => {
    renderPanel();
    fireEvent.click((await screen.findAllByLabelText('Remove Launch t-shirt from cart'))[0] as HTMLElement);

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(String((post?.[1] as RequestInit).body))).toEqual({ action: 'remove', variantId: 'var-violet-l' });
    });
  });

  it('shows the empty state with a way back to the shop', async () => {
    fetchMock.mockImplementation(async () => json({ id: null, lines: [], totalQuantity: 0, subtotalCents: 0, currency: 'USD' }));
    renderPanel();
    expect(await screen.findByText('Your cart is empty.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toBeTruthy();
  });
});
