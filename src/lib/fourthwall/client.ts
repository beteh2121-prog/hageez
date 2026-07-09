/**
 * Client for Fourthwall's Storefront API.
 * Confirmed against https://docs.fourthwall.com/storefront-api
 *
 * Auth: storefront_token query param (NOT Basic Auth)
 * Get token: Fourthwall → Settings → For Developers → Headless → Storefront API token
 *
 * This client is used for TWO purposes:
 * 1. Syncing the product catalog into our Supabase database (all products
 *    from Fourthwall are treated as PHYSICAL MERCH — digital downloads
 *    come from Gumroad instead)
 * 2. Creating checkout sessions when a customer clicks "Buy Now"
 */

const STOREFRONT_API_BASE = 'https://storefront-api.fourthwall.com/v1';

export interface FourthwallStorefrontMoney {
  value: number;
  currency: string;
}

export interface FourthwallStorefrontImage {
  id: string;
  url: string;
  width: number;
  height: number;
  transformedUrl: string;
}

export interface FourthwallStorefrontVariant {
  id: string;
  name: string;
  sku: string;
  unitPrice: FourthwallStorefrontMoney;
  compareAtPrice?: FourthwallStorefrontMoney;
  images: FourthwallStorefrontImage[];
}

export interface FourthwallStorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  state: { type: string };
  images: FourthwallStorefrontImage[];
  variants: FourthwallStorefrontVariant[];
  createdAt: string;
  updatedAt: string;
}

interface PagedResponse<T> {
  results: T[];
  paging: {
    pageNumber: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

interface FourthwallCart {
  checkoutUrl?: string;
  checkout_url?: string;
}

export class FourthwallApiError extends Error {}

function getStorefrontToken(): string {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) {
    throw new FourthwallApiError(
      'FOURTHWALL_STOREFRONT_TOKEN is not set. ' +
      'Get one from Fourthwall → Settings → For Developers → Headless.'
    );
  }
  return token;
}

/**
 * Fetch every product from the built-in "all" collection.
 * All products are treated as physical merch.
 */
export async function fetchAllFourthwallProducts(): Promise<FourthwallStorefrontProduct[]> {
  const token = getStorefrontToken();
  const products: FourthwallStorefrontProduct[] = [];
  let page = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    const url =
      STOREFRONT_API_BASE +
      '/collections/all/products?storefront_token=' +
      token +
      '&page=' +
      page +
      '&size=50';

    const response = await fetch(url);

    if (!response.ok) {
      throw new FourthwallApiError(
        'Fourthwall Storefront API returned ' + response.status + ' ' + response.statusText
      );
    }

    const data = (await response.json()) as PagedResponse<FourthwallStorefrontProduct>;
    products.push(...data.results);
    hasNextPage = data.paging.hasNextPage;
    page += 1;
  }

  return products;
}

/**
 * Create a Fourthwall checkout session from a list of items.
 * Each item needs: fourthwall product ID + quantity.
 * Returns the checkout URL to redirect the customer to.
 */
export async function createFourthwallCheckout(
  items: { fourthwall_id: string; quantity: number }[]
): Promise<string> {
  const token = getStorefrontToken();

  // Step 1: For each product ID, fetch the product to get its first variant ID
  const cartItems: { variantId: string; quantity: number }[] = [];

  for (const item of items) {
    const productRes = await fetch(
      STOREFRONT_API_BASE + '/products/' + item.fourthwall_id + '?storefront_token=' + token
    );

    if (!productRes.ok) {
      throw new FourthwallApiError(
        'Could not find Fourthwall product: ' + item.fourthwall_id +
        '. Verify this ID matches a real product in your Fourthwall store.'
      );
    }

    const product = (await productRes.json()) as FourthwallStorefrontProduct;
    const variantId = product.variants[0]?.id;

    if (!variantId) {
      throw new FourthwallApiError(
        'Product "' + product.name + '" has no variants — cannot add to checkout.'
      );
    }

    cartItems.push({ variantId, quantity: item.quantity });
  }

  // Step 2: Create the cart and get the checkout URL
  const cartRes = await fetch(
    STOREFRONT_API_BASE + '/carts?storefront_token=' + token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems }),
    }
  );

  if (!cartRes.ok) {
    const errorText = await cartRes.text();
    throw new FourthwallApiError('Fourthwall cart creation failed: ' + errorText);
  }

  const cart = (await cartRes.json()) as FourthwallCart;
  const checkoutUrl = cart.checkoutUrl ?? cart.checkout_url;

  if (!checkoutUrl) {
    throw new FourthwallApiError(
      'No checkout URL returned from Fourthwall. ' +
      'Check your FOURTHWALL_STOREFRONT_TOKEN and store configuration.'
    );
  }

  return checkoutUrl;
}
