import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { slugify } from '@/lib/utils/slugify';

// Converts a raw HMAC signature to base64 using only Web APIs (btoa),
// not Buffer — Buffer is Node.js-specific and, while Cloudflare's
// nodejs_compat flag polyfills it, avoiding it entirely removes any
// dependency on that polyfill for something this small. Works
// identically on Cloudflare Workers, Vercel, and any other host.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
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
  const computedBase64 = arrayBufferToBase64(signatureBuffer);

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
  // Fourthwall's own product slug — what the Storefront API looks products up by.
  slug?: string;
  description?: string;
  // UPGRADE 2: variants can also carry digital signals.
  variants?: {
    unitPrice?: FourthwallMoney;
    digitalFiles?: FourthwallDigitalFile[];
    type?: string;
  }[];
  images?: FourthwallImage[];
  // Presence of a non-empty digitalFiles array is the documented signal
  // for "this offer is a digital product" — more reliable than `type`,
  // whose read-side enum (STANDARD | GIFT_CARD | UNKNOWN) doesn't actually
  // include a "digital" value despite the create endpoint accepting
  // type: "digital" on input.
  digitalFiles?: FourthwallDigitalFile[];
  // UPGRADE 2: extra signals checked when digitalFiles is absent.
  type?: string;
  digital?: boolean;
  isDigital?: boolean;
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

  const supabase = createServiceClient();

  const { data: logRow, error: logInsertError } = await supabase
    .from('webhook_logs')
    .insert({ source: 'fourthwall', event_type: payload.type, payload, status: 'received' })
    .select('id')
    .single();

  if (logInsertError) {
    // This should never fail silently — if you're seeing this in the
    // deployment logs, that's the real reason webhook_logs stayed empty despite a 200
    // response. Common causes: SUPABASE_SERVICE_ROLE_KEY is missing/wrong/
    // truncated in the environment variables, or NEXT_PUBLIC_SUPABASE_URL is wrong.
    console.error('Failed to insert webhook_logs row:', logInsertError.message, logInsertError);
  }

  try {
    await handleEvent(supabase, payload);
    refreshStorefrontCache(payload);
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

/**
 * Drops cached Fourthwall data so product/collection edits show up right
 * away instead of waiting for the ISR window. Best-effort and never throws:
 * on a Worker without an incremental-cache binding this is a harmless no-op.
 */
function refreshStorefrontCache(payload: FourthwallEvent): void {
  try {
    const slug = typeof payload.data.slug === 'string' ? payload.data.slug : '';

    switch (payload.type) {
      case 'PRODUCT_CREATED':
      case 'PRODUCT_UPDATED':
        if (slug) revalidateTag(`product-${slug}`);
        revalidateTag('fw-products');
        revalidatePath('/shop');
        revalidatePath('/');
        return;
      case 'COLLECTION_UPDATED':
        revalidateTag('fw-products');
        revalidatePath('/shop');
        return;
      default:
        return;
    }
  } catch (error) {
    console.warn('Storefront cache revalidation skipped:', error);
  }
}

// UPGRADE 2: some Fourthwall events wrap the product as { product: {...} }.
// Unwrap it so id / name / slug are always read from the product itself.
function unwrapProduct(data: Record<string, unknown>): FourthwallProductData {
  const inner = data.product;
  if (typeof inner === 'object' && inner !== null && !Array.isArray(inner)) {
    return inner as unknown as FourthwallProductData;
  }
  return data as unknown as FourthwallProductData;
}

async function handleEvent(supabase: SupabaseClient, payload: FourthwallEvent): Promise<void> {
  switch (payload.type) {
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
      await handleProductUpsert(supabase, unwrapProduct(payload.data));
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

function hasFiles(files: FourthwallDigitalFile[] | undefined): boolean {
  return Array.isArray(files) && files.length > 0;
}

// UPGRADE 2: a product counts as digital if ANY of these signals is present.
// The original rule (non-empty digitalFiles) is still the first check.
function hasDigitalSignal(data: FourthwallProductData): boolean {
  if (hasFiles(data.digitalFiles)) return true;
  if (data.digital === true || data.isDigital === true) return true;
  if (typeof data.type === 'string' && data.type.toLowerCase() === 'digital') return true;
  return (data.variants ?? []).some(
    (variant) =>
      hasFiles(variant.digitalFiles) ||
      (typeof variant.type === 'string' && variant.type.toLowerCase() === 'digital')
  );
}

// UPGRADE 2: when the webhook payload has no digital signal, ask the
// Fourthwall Open API for the full product (needs FOURTHWALL_API_USERNAME
// and FOURTHWALL_API_PASSWORD). Returns null on any failure — never throws.
async function fetchProductFromApi(productId: string): Promise<FourthwallProductData | null> {
  const username = process.env.FOURTHWALL_API_USERNAME;
  const password = process.env.FOURTHWALL_API_PASSWORD;
  if (!username || !password) return null;

  try {
    const response = await fetch(
      `https://api.fourthwall.com/open-api/v1.0/products/${encodeURIComponent(productId)}`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) return null;
    const json: unknown = await response.json();
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return null;
    return unwrapProduct(json as Record<string, unknown>);
  } catch {
    return null;
  }
}

// UPGRADE 2: single place that decides digital vs merch.
// Order: payload signal → already stored as a download → Open API lookup.
async function resolveProduct(
  supabase: SupabaseClient,
  data: FourthwallProductData
): Promise<{ isDigital: boolean; product: FourthwallProductData }> {
  if (hasDigitalSignal(data)) return { isDigital: true, product: data };

  const { data: existing } = await supabase
    .from('downloads')
    .select('id')
    .eq('fourthwall_product_id', data.id)
    .maybeSingle();
  if (existing) return { isDigital: true, product: data };

  const apiProduct = await fetchProductFromApi(data.id);
  if (apiProduct && hasDigitalSignal(apiProduct)) {
    return { isDigital: true, product: { ...data, ...apiProduct, id: data.id } };
  }

  if (!apiProduct) {
    console.warn(
      `Product ${data.id}: no digital signal in payload and Open API lookup unavailable — treating as merch.`
    );
  }
  return { isDigital: false, product: data };
}

// UPGRADE: derive downloads.file_type from the Fourthwall file names so the
// storefront can show the right icon (pdf / epub / mp3 / video).
// UPGRADE 2: also reads files that sit on the variants.
function detectFileType(data: FourthwallProductData): 'pdf' | 'epub' | 'mp3' | 'video' | null {
  const files: FourthwallDigitalFile[] = [
    ...(data.digitalFiles ?? []),
    ...(data.variants ?? []).flatMap((variant) => variant.digitalFiles ?? []),
  ];
  for (const file of files) {
    const name = (file.name ?? '').toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.epub')) return 'epub';
    if (name.endsWith('.mp3')) return 'mp3';
    if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm')) return 'video';
  }
  return null;
}

async function handleProductUpsert(supabase: SupabaseClient, rawData: FourthwallProductData): Promise<void> {
  const { isDigital, product: data } = await resolveProduct(supabase, rawData);
  const slug = data.slug || slugify(data.name ?? '');
  const priceCents = Math.round((data.variants?.[0]?.unitPrice?.value ?? 0) * 100);

  if (isDigital) {
    const fileType = detectFileType(data);
    const { error } = await supabase.from('downloads').upsert(
      {
        fourthwall_product_id: data.id,
        title: data.name,
        slug,
        description: data.description ?? null,
        price_cents: priceCents,
        // UPGRADE: only send file_type when detected, so an admin-set value is never wiped.
        ...(fileType ? { file_type: fileType } : {}),
      },
      { onConflict: 'fourthwall_product_id' }
    );
    if (error) throw new Error(`downloads upsert failed: ${error.message}`);

    // UPGRADE: if this product was earlier synced as merch, archive the stale
    // merch row so it no longer shows in the Shop. No row = harmless no-op.
    const { error: archiveError } = await supabase
      .from('merch')
      .update({ status: 'archived' })
      .eq('fourthwall_id', data.id);
    if (archiveError) throw new Error(`merch archive failed: ${archiveError.message}`);
  } else {
    const { error } = await supabase.from('merch').upsert(
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
    if (error) throw new Error(`merch upsert failed: ${error.message}`);
  }
}

// UPGRADE: link a purchase to a registered user by email, so the downloads
// page can show the "Purchased" state. Guests simply get null.
async function findUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  if (!email) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

async function handleOrderPlaced(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  const customerEmail = data.email ?? '';

  const { error: orderUpsertError } = await supabase.from('orders').upsert(
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
  if (orderUpsertError) throw new Error(`orders upsert failed: ${orderUpsertError.message}`);

  const offers = data.offers ?? [];
  const userId = await findUserIdByEmail(supabase, customerEmail);

  for (const offer of offers) {
    const { data: download } = await supabase
      .from('downloads')
      .select('id')
      .eq('fourthwall_product_id', offer.id)
      .single();

    if (!download) continue; // Not a digital product we're tracking — skip.

    // UPGRADE (Option A): Fourthwall delivers the paid file itself, so we only
    // record the purchase. No signed URL, no email from us.
    // Upsert on (order, download) keeps webhook retries from duplicating rows.
    const { error: purchaseError } = await supabase.from('download_purchases').upsert(
      {
        user_id: userId,
        download_id: download.id,
        fourthwall_order_id: data.id,
        amount_paid_cents: Math.round((offer.variant?.unitPrice?.value ?? 0) * 100),
        delivery_email: customerEmail,
        delivered_at: new Date().toISOString(),
      },
      { onConflict: 'fourthwall_order_id,download_id', ignoreDuplicates: true }
    );
    if (purchaseError) throw new Error(`download_purchases upsert failed: ${purchaseError.message}`);
  }
}

async function handleOrderUpdated(supabase: SupabaseClient, data: FourthwallOrderData): Promise<void> {
  const mappedStatus = mapOrderStatus(data.status);
  if (!mappedStatus) return; // Unrecognized status — leave our record as-is.

  await supabase.from('orders').update({ status: mappedStatus }).eq('fourthwall_order_id', data.id);

  // UPGRADE: a cancelled order should no longer count as a purchase.
  if (mappedStatus === 'cancelled') {
    const { error } = await supabase
      .from('download_purchases')
      .update({ revoked_at: new Date().toISOString() })
      .eq('fourthwall_order_id', data.id);
    if (error) throw new Error(`download_purchases revoke failed: ${error.message}`);
  }
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
