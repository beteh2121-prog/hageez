import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '../supabase/service';
import { slugify } from '../utils/slugify';
import { fetchAllFourthwallProducts, isSoldOut, lowestPriceCents } from '../fourthwall/client';
import { fetchAllGumroadProducts, getGumroadProductUrl } from '../gumroad/client';

export type Source = 'fourthwall' | 'gumroad';

export interface SyncResult {
  source: Source;
  synced: number;
  errors: string[];
}

const CHUNK_SIZE = 200;

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function upsertInChunks(
  supabase: SupabaseClient,
  table: 'merch' | 'downloads',
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + CHUNK_SIZE), { onConflict });
    if (error) throw new Error(`Saving ${table} failed: ${error.message}`);
  }
}

/** One SELECT, then unique slugs for every item (no per-item queries). */
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

// Fourthwall = physical merch ONLY -> `merch` table.
export async function syncFourthwall(): Promise<SyncResult> {
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

    await upsertInChunks(supabase, 'merch', rows, 'fourthwall_id');
    result.synced = rows.length;
  } catch (err) {
    result.errors.push(messageOf(err, 'Fourthwall sync failed'));
  }
  return result;
}

// Gumroad = digital downloads ONLY -> `downloads` table.
export async function syncGumroad(): Promise<SyncResult> {
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

    await upsertInChunks(supabase, 'downloads', rows, 'gumroad_product_id');
    result.synced = rows.length;
  } catch (err) {
    result.errors.push(messageOf(err, 'Gumroad sync failed'));
  }
  return result;
}
