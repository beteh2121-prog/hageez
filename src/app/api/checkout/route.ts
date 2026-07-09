import { NextResponse } from 'next/server';
import { createFourthwallCheckout } from '@/lib/fourthwall/client';

interface CartItem {
  fourthwall_id: string;
  quantity: number;
}

interface CheckoutBody {
  items?: CartItem[];
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  const items = body?.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  try {
    const checkoutUrl = await createFourthwallCheckout(items);
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
