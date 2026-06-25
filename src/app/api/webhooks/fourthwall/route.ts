import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSignedUrl } from '@/lib/supabase/storage';
import { deliverDownloadEmail } from '@/lib/email/deliverDownload';
import { slugify } from '@/lib/utils/slugify';

function getServiceClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Best-effort, per-instance rate limit. It resets on cold start, which is
// an accepted tradeoff here: Fourthwall calls this endpoint from a small,
// known set of IPs, so this guards against retry storms rather than a
// determined attacker — the HMAC signature check below is the real gate.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;

  const secret = process.env.FOURTHWALL_WEBHOOK_SECRET ?? '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(computedHex, signature);
}

// ── Fourthwall payload shapes ────────────────────────────────────────────
// These interfaces document the field names referenced in the original
// build spec. Confirm them against a real Fourthwall test event in
// webhook_logs.payload before going live, and adjust if their actual
// schema differs — that's why every access below is optional-chained.

interface FourthwallMoney {
  value?: number;
  currency?: string;
}

interface FourthwallImage {
  url: string;
}

interface FourthwallProductData {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  metadata?: { type?: string };
  variants?: { unitPrice?: FourthwallMoney }[];
  images?: FourthwallImage[];
}

interface FourthwallLineItem {
  productId?: string;
  unitPrice?: FourthwallMoney;
  metadata?: { type?: string };
}

interface FourthwallOrderData {
  id: string;
  customer?: { email?: string };
  email?: string;
  totals?: { total?: FourthwallMoney };
  shippingAddress?: Record<string, unknown>;
  lineItems?: FourthwallLineItem[];
  tracking?: Record<string, unknown>;
}

interface FourthwallEvent {
  type: string;
  data: Record<string, unknown>;
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-fourthwall-signature');
  const isValid = await verifySignature(rawBody, signature);

  if (!isValid) {
    // Never log details for failed auth requests.
    return new NextResponse(null, { status: 401 });
  }

  let payload: FourthwallEvent;
  try {
    payload = JSON.parse(rawBody) as FourthwallEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: logRow } = await supabase
    .from('webhook_logs')
    .insert({ source: 'fourthwall', event_type: payload.type, payload, status: 'received' })
    .select('id')
    .single();

  try {
    await handleEvent(supabase, payload);
    if (logRow) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', logRow.id);
    }
  } catch (err) {
    if (logRow) {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          processed_at: new Date().toISOString(),
        })
        .eq('id', logRow.id);
    }
  }

  // Always 200 on a verified, parsed request — Fourthwall should never
  // retry on our internal processing errors.
  return NextResponse.json({ received: true });
}

async function handleEvent(supabase: SupabaseClient, payload: FourthwallEvent): Promise<void> {
  switch (payload.type) {
    case 'product.created':
    case 'product.updated':
      await handleProductUpsert(supabase, payload.data as unknown as FourthwallProductData);
      return;
    case 'order.paid':
      await handleOrderPaid(supabase, payload.data as unknown as FourthwallOrderData);
      return;
    case 'order.shipped':
      await handleOrderShipped(supabase, payload.data as unknown as FourthwallOrderData);
      return;
    case 'order.refunded':
      await handleOrderRefunded(supabase, payload.data as unknown as FourthwallOrderData);
      return;
    default:
      // All other events: nothing to do, but the 'processed' update above
      // still marks the log row as handled — its event_type column
      // already records what it was.
      return;
  }
}

async function handleProductUpsert(supabase: SupabaseClient, data: FourthwallProductData): Promise<void> {
  const slug = slugify(data.name ?? data.title ?? '');
  const isDigital = data.metadata?.type === 'digital_download';
  const priceCents = Math.round((data.variants?.[0]?.unitPrice?.value ?? 0) * 100);

  if (isDigital) {
    await supabase.from('downloads').upsert(
      {
        fourthwall_product_id: data.id,
        title: data.name,
        slug,
        description: data.description ?? null,
        price_cents: priceCents,
      },
      { onConflict: 'fourthwall_product_id' }
    );
  } else {
    await supabase.from('merch').upsert(
      {
        fourthwall_id: data.id,
        title: data.name,
        slug,
        description: data.description ?? null,
        price_cents: priceCents,
        images: (data.images ?? []).map((img) => ({ url: img.url, alt: data.name ?? '' })),
        status: 'active',
      },
      { onConflict: 'fourthwall_id' }
    );
  }
}

async function handleOrderPaid(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  const customerEmail = data.customer?.email ?? data.email ?? '';

  await supabase.from('orders').upsert(
    {
      fourthwall_order_id: data.id,
      status: 'paid',
      total_cents: Math.round((data.totals?.total?.value ?? 0) * 100),
      currency: data.totals?.total?.currency ?? 'USD',
      shipping_address: data.shippingAddress ?? null,
      line_items: data.lineItems ?? [],
    },
    { onConflict: 'fourthwall_order_id' }
  );

  const lineItems = data.lineItems ?? [];

  for (const item of lineItems) {
    if (item.metadata?.type !== 'digital_download') continue;

    const { data: download } = await supabase
      .from('downloads')
      .select('id, file_path')
      .eq('fourthwall_product_id', item.productId ?? '')
      .single();

    if (!download) continue;

    await supabase.from('download_purchases').insert({
      download_id: download.id,
      fourthwall_order_id: data.id,
      amount_paid_cents: Math.round((item.unitPrice?.value ?? 0) * 100),
      delivery_email: customerEmail,
    });

    const signedUrl = await getSignedUrl('downloads', download.file_path, 259200); // 72 hours

    const result = await deliverDownloadEmail({
      downloadId: download.id,
      email: customerEmail,
      signedUrl,
    });

    if (!result.success) {
      await supabase
        .from('download_purchases')
        .update({ pending_delivery_url: signedUrl })
        .eq('download_id', download.id)
        .eq('delivery_email', customerEmail);

      await supabase.from('webhook_logs').insert({
        source: 'fourthwall',
        event_type: 'order.paid',
        payload: { downloadId: download.id, email: customerEmail, error: result.error },
        status: 'delivery_failed',
      });
    }
  }
}

async function handleOrderShipped(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  await supabase
    .from('orders')
    .update({ status: 'shipped', metadata: data.tracking ?? null })
    .eq('fourthwall_order_id', data.id);
}

async function handleOrderRefunded(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  await supabase.from('orders').update({ status: 'refunded' }).eq('fourthwall_order_id', data.id);

  await supabase
    .from('download_purchases')
    .update({ revoked_at: new Date().toISOString() })
    .eq('fourthwall_order_id', data.id);
}
