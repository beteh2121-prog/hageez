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

// Per https://docs.fourthwall.com/webhooks/signature-verification — the
// signature is HMAC-SHA256 over the raw body, BASE64 encoded (not hex),
// sent in the `X-Fourthwall-Hmac-SHA256` header.
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
  const computedBase64 = Buffer.from(signatureBuffer).toString('base64');

  return timingSafeEqual(computedBase64, signature);
}

// ── Fourthwall payload shapes ────────────────────────────────────────────
// Confirmed against https://docs.fourthwall.com (webhook model, order
// schema, product schema) as of this build. The webhook payload for
// products/orders may not be byte-identical to the REST API's read
// schemas, so every field below is still optional-chained defensively —
// double check actual values in webhook_logs.payload against a real test
// event before relying on a field not listed here.

interface FourthwallMoney {
  value?: number;
  currency?: string;
}

interface FourthwallImage {
  url: string;
}

interface FourthwallDigitalFile {
  uri: string;
  name: string;
}

interface FourthwallProductData {
  id: string;
  name?: string;
  description?: string;
  variants?: { unitPrice?: FourthwallMoney }[];
  images?: FourthwallImage[];
  // Presence of a non-empty digitalFiles array is the documented signal
  // for "this offer is a digital product" — more reliable than `type`,
  // whose read-side enum (STANDARD | GIFT_CARD | UNKNOWN) doesn't actually
  // include a "digital" value despite the create endpoint accepting
  // type: "digital" on input.
  digitalFiles?: FourthwallDigitalFile[];
}

interface FourthwallOfferVariant {
  unitPrice?: FourthwallMoney;
}

interface FourthwallOffer {
  id: string;
  variant?: FourthwallOfferVariant;
}

// Real order status enum per Fourthwall's Order schema. Note there is no
// REFUNDED value — Fourthwall's webhook API does not appear to expose
// refunds as an order status or a separate event. Refunds currently need
// to be reflected manually via /admin/orders' status dropdown until/unless
// Fourthwall exposes a refund signal.
type FourthwallOrderStatus =
  | 'CONFIRMED'
  | 'PARTIALLY_IN_PRODUCTION'
  | 'IN_PRODUCTION'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED';

interface FourthwallOrderData {
  id: string;
  email?: string;
  status?: FourthwallOrderStatus;
  amounts?: { total?: FourthwallMoney };
  shipping?: { address?: Record<string, unknown> };
  offers?: FourthwallOffer[];
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
  const signature = request.headers.get('x-fourthwall-hmac-sha256');
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
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
      await handleProductUpsert(supabase, payload.data as unknown as FourthwallProductData);
      return;
    case 'ORDER_PLACED':
      await handleOrderPlaced(supabase, payload.data as unknown as FourthwallOrderData);
      return;
    case 'ORDER_UPDATED':
      await handleOrderUpdated(supabase, payload.data as unknown as FourthwallOrderData);
      return;
    default:
      // All other event types (cart abandonment, memberships, donations,
      // gifts, promotions, newsletter signups) aren't used by this site —
      // logged via webhook_logs above, nothing further to do.
      return;
  }
}

function isDigitalProduct(data: FourthwallProductData): boolean {
  return Array.isArray(data.digitalFiles) && data.digitalFiles.length > 0;
}

async function handleProductUpsert(supabase: SupabaseClient, data: FourthwallProductData): Promise<void> {
  const slug = slugify(data.name ?? '');
  const priceCents = Math.round((data.variants?.[0]?.unitPrice?.value ?? 0) * 100);

  if (isDigitalProduct(data)) {
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

async function handleOrderPlaced(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  const customerEmail = data.email ?? '';

  await supabase.from('orders').upsert(
    {
      fourthwall_order_id: data.id,
      status: 'paid',
      total_cents: Math.round((data.amounts?.total?.value ?? 0) * 100),
      currency: data.amounts?.total?.currency ?? 'USD',
      shipping_address: data.shipping?.address ?? null,
      line_items: data.offers ?? [],
    },
    { onConflict: 'fourthwall_order_id' }
  );

  const offers = data.offers ?? [];

  for (const offer of offers) {
    const { data: download } = await supabase
      .from('downloads')
      .select('id, file_path')
      .eq('fourthwall_product_id', offer.id)
      .single();

    if (!download) continue; // Not a digital product we're tracking — skip.

    await supabase.from('download_purchases').insert({
      download_id: download.id,
      fourthwall_order_id: data.id,
      amount_paid_cents: Math.round((offer.variant?.unitPrice?.value ?? 0) * 100),
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
        event_type: 'ORDER_PLACED',
        payload: { downloadId: download.id, email: customerEmail, error: result.error },
        status: 'delivery_failed',
      });
    }
  }
}

async function handleOrderUpdated(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  const mappedStatus = mapOrderStatus(data.status);
  if (!mappedStatus) return; // Unrecognized status — leave our record as-is.

  await supabase.from('orders').update({ status: mappedStatus }).eq('fourthwall_order_id', data.id);
}

function mapOrderStatus(
  status: FourthwallOrderStatus | undefined
): 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null {
  switch (status) {
    case 'CONFIRMED':
      return 'paid';
    case 'PARTIALLY_IN_PRODUCTION':
    case 'IN_PRODUCTION':
      return 'processing';
    case 'PARTIALLY_SHIPPED':
    case 'SHIPPED':
      return 'shipped';
    case 'PARTIALLY_DELIVERED':
    case 'DELIVERED':
    case 'COMPLETED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return null;
  }
}
