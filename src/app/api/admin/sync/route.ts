import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { slugify } from '@/lib/utils/slugify';
import {
  fetchAllFourthwallProducts,
  isSoldOut,
  lowestPriceCents,
} from '@/lib/fourthwall/client';
import { fetchAllGumroadProducts, getGumroadProductUrl } from '@/lib/gumroad/client';

export const dynamic = 'force-dynamic';

type Source = 'fourthwall' | 'gumroad';

interface SyncResult {
  source: Source;
  synced: number;
  errors: string[];
}

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

/**
 * Gives every item a slug that no OTHER row uses. One SELECT instead of one
 * query per item, so we stay far below Cloudflare's subrequest limit.
 */
async function resolveSlugs(
  supabase: SupabaseClient,
  table: 'merch' | 'downloads',
  idColumn: 'fourthwall_id' | 'gumroad_product_id',
  items: { id: string; desired: string }[]
): Promise<Map<string, string>> {
  const { data, error } = await supabase.from(table).select(`slug, ${idColumn}`);
  if (error) throw new Error(`Could not read existing ${table}: ${error.message}`);

  const owner = new Map<string, string | null>();
  for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
    if (row.slug) owner.set(row.slug, row[idColumn] ?? null);
  }

  const result = new Map<string, string>();
  for (const { id, desired } of items) {
    const base = desired || 'item';
    let candidate = base;
    if (owner.has(candidate) && owner.get(candidate) !== id) {
      candidate = `${base}-${id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase()}`;
    }
    owner.set(candidate, id);
    result.set(id, candidate);
  }
  return result;
}

// Fourthwall = physical merch ONLY → `merch` table.
async function syncFourthwall(): Promise<SyncResult> {
  const result: SyncResult = { source: 'fourthwall', synced: 0, errors: [] };

  try {
    const products = await fetchAllFourthwallProducts();
    if (products.length === 0) return result;

    const supabase = createServiceClient();
    const slugs = await resolveSlugs(
      supabase,
      'merch',
      'fourthwall_id',
      products.map((p) => ({ id: p.id, desired: p.slug || slugify(p.name) }))
    );

    const rows = products.map((product) => ({
      fourthwall_id: product.id,
      source: 'fourthwall',
      title: product.name,
      slug: slugs.get(product.id) ?? slugify(product.name),
      description: product.description || null,
      price_cents: lowestPriceCents(product),
      images: (product.images ?? []).map((img) => ({
        url: img.transformedUrl || img.url,
        alt: product.name,
      })),
      status: isSoldOut(product) ? 'archived' : 'active',
      currency: 'USD',
    }));

    // ONE request for the whole catalog.
    const { error } = await supabase.from('merch').upsert(rows, { onConflict: 'fourthwall_id' });
    if (error) throw new Error(`Saving merch failed: ${error.message}`);
    result.synced = rows.length;
  } catch (err) {
    result.errors.push(messageOf(err, 'Fourthwall sync failed'));
  }

  return result;
}

// Gumroad = digital downloads ONLY → `downloads` table.
async function syncGumroad(): Promise<SyncResult> {
  const result: SyncResult = { source: 'gumroad', synced: 0, errors: [] };

  try {
    const products = (await fetchAllGumroadProducts()).filter((p) => p.published);
    if (products.length === 0) return result;

    const usable = products.flatMap((product) => {
      const url = getGumroadProductUrl(product);
      if (!url) {
        result.errors.push(`"${product.name}": Gumroad returned no usable product URL`);
        return [];
      }
      return [{ product, url }];
    });
    if (usable.length === 0) return result;

    const supabase = createServiceClient();
    const slugs = await resolveSlugs(
      supabase,
      'downloads',
      'gumroad_product_id',
      usable.map(({ product }) => ({ id: product.id, desired: slugify(product.name) }))
    );

    const rows = usable.map(({ product, url }) => ({
      gumroad_product_id: product.id,
      source: 'gumroad',
      title: product.name,
      slug: slugs.get(product.id) ?? slugify(product.name),
      description: product.description || null,
      price_cents: product.price,
      cover_path: product.thumbnail_url,
      preview_url: product.preview_url,
      external_url: url,
    }));

    const { error } = await supabase
      .from('downloads')
      .upsert(rows, { onConflict: 'gumroad_product_id' });
    if (error) throw new Error(`Saving downloads failed: ${error.message}`);
    result.synced = rows.length;
  } catch (err) {
    result.errors.push(messageOf(err, 'Gumroad sync failed'));
  }

  return result;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = (await request.json().catch(() => ({}))) as { sources?: unknown };
    const requested = Array.isArray(body.sources) ? body.sources : ['fourthwall', 'gumroad'];
    const sources = requested.filter((s): s is Source => s === 'fourthwall' || s === 'gumroad');

    const results: SyncResult[] = [];
    if (sources.includes('fourthwall')) results.push(await syncFourthwall());
    if (sources.includes('gumroad')) results.push(await syncGumroad());

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({ success: totalErrors === 0, totalSynced, totalErrors, results });
  } catch (err) {
    console.error('Catalog sync crashed:', err);
    return NextResponse.json(
      { error: messageOf(err, 'Catalog sync crashed unexpectedly.') },
      { status: 500 }
    );
  }
}
