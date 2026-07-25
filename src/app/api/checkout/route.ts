import { NextResponse } from 'next/server';

const STOREFRONT_API_BASE = 'https://storefront-api.fourthwall.com/v1';

interface CartItem {
  fourthwall_id: string;
  quantity: number;
}

interface CheckoutBody {
  items?: CartItem[];
}

interface FourthwallVariant {
  id: string;
}

interface FourthwallProduct {
  variants?: FourthwallVariant[];
}

interface FourthwallCart {
  checkoutUrl?: string;
  checkout_url?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'FOURTHWALL_STOREFRONT_TOKEN is not set' },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  const items = body?.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // For each cart item, fetch the product from Fourthwall to get
  // the first variant ID — the cart API needs variant IDs, not product IDs.
  const cartItems: { variantId: string; quantity: number }[] = [];

  for (const item of items) {
    const productRes = await fetch(
      `${STOREFRONT_API_BASE}/products/${item.fourthwall_id}?storefront_token=${token}`
    );

    if (!productRes.ok) {
      return NextResponse.json(
        { error: `Could not find product ${item.fourthwall_id}` },
        { status: 400 }
      );
    }

    const product = (await productRes.json()) as FourthwallProduct;
    const variantId = product.variants?.[0]?.id;

    if (!variantId) {
      return NextResponse.json(
        { error: `Product ${item.fourthwall_id} has no variants` },
        { status: 400 }
      );
    }

    cartItems.push({ variantId, quantity: item.quantity });
  }

  // Create the cart on Fourthwall and get the checkout URL.
  const cartRes = await fetch(
    `${STOREFRONT_API_BASE}/carts?storefront_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems }),
    }
  );

  if (!cartRes.ok) {
    const errorText = await cartRes.text();
    return NextResponse.json(
      { error: `Fourthwall cart creation failed: ${errorText}` },
      { status: 500 }
    );
  }

  const cart = (await cartRes.json()) as FourthwallCart;

  // Fourthwall may use checkoutUrl or checkout_url depending on API version.
  const checkoutUrl = cart.checkoutUrl ?? cart.checkout_url;

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: 'No checkout URL returned from Fourthwall' },
      { status: 500 }
    );
  }

  return NextResponse.json({ checkoutUrl });
}
