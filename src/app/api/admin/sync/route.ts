import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { slugify } from '@/lib/utils/slugify';
import {
  fetchAllFourthwallProducts,
  isSoldOut,
  lowestPriceCents,
  type FourthwallStorefrontProduct,
} from '@/lib/fourthwall/client';
import {
  fetchAllGumroadProducts,
  getGumroadProductUrl,
  type GumroadProduct,
} from '@/lib/gumroad/client';

interface SyncResult {
  source: 'fourthwall' | 'gumroad';
  synced: number;
  errors: string[];
}

async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return null;
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

// ── Fourthwall sync ───────────────────────────────────────────────────────
// Fourthwall = physical merch ONLY.
// Every product from Fourthwall goes into the `merch` table, no exceptions.
// Digital downloads come from Gumroad, not Fourthwall.
async function syncFourthwall(): Promise<SyncResult> {
  const result: SyncResult = { source: 'fourthwall', synced: 0, errors: [] };
  const supabase = createServiceClient();

  let products: FourthwallStorefrontProduct[];
  try {
    products = await fetchAllFourthwallProducts();
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : 'Failed to fetch Fourthwall products');
    return result;
  }

  for (const product of products) {
    const title = product.name;
    // Use Fourthwall's real slug: single-product lookups are by slug.
    const slug = product.slug || slugify(title);
    const images = (product.images ?? []).map((img) => ({
      url: img.transformedUrl || img.url,
      alt: title,
    }));

    try {
      const { error } = await supabase.from('merch').upsert(
        {
          fourthwall_id: product.id,
          source: 'fourthwall',
          title,
          slug,
          description: product.description || null,
          // Bundles have no variants — lowestPriceCents handles both cases.
          price_cents: lowestPriceCents(product),
          images,
          status: isSoldOut(product) ? 'archived' : 'active',
          currency: 'USD',
        },
        { onConflict: 'fourthwall_id' }
      );
      if (error) throw new Error(error.message);
      result.synced += 1;
    } catch (err) {
      result.errors.push(
        '"' + title + '": ' + (err instanceof Error ? err.message : 'unknown error')
      );
    }
  }

  return result;
}

// ── Gumroad sync ──────────────────────────────────────────────────────────
// Gumroad = digital downloads ONLY.
// Every Gumroad product goes into the `downloads` table.
// The external_url field stores the Gumroad product URL so the
// storefront can link directly to Gumroad for purchase/download.
async function syncGumroad(): Promise<SyncResult> {
  const result: SyncResult = { source: 'gumroad', synced: 0, errors: [] };
  const supabase = createServiceClient();

  let products: GumroadProduct[];
  try {
    products = await fetchAllGumroadProducts();
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : 'Failed to fetch Gumroad products');
    return result;
  }

  for (const product of products) {
    if (!product.published) continue;

    const slug = slugify(product.name);
    const productUrl = getGumroadProductUrl(product);

    if (!productUrl) {
      result.errors.push('"' + product.name + '": Gumroad returned no usable product URL');
      continue;
    }

    try {
      const { error } = await supabase.from('downloads').upsert(
        {
          gumroad_product_id: product.id,
          source: 'gumroad',
          title: product.name,
          slug,
          description: product.description || null,
          price_cents: product.price,
          cover_path: product.thumbnail_url,
          preview_url: product.preview_url,
          // external_url is where the Buy/Get button on the storefront
          // will send the customer — directly to the Gumroad product page.
          external_url: productUrl,
        },
        { onConflict: 'gumroad_product_id' }
      );
      if (error) throw new Error(error.message);
      result.synced += 1;
    } catch (err) {
      result.errors.push(
        '"' + product.name + '": ' + (err instanceof Error ? err.message : 'unknown error')
      );
    }
  }

  return result;
}

export async function POST(request: Request): Promise<NextResponse> {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as { sources?: ('fourthwall' | 'gumroad')[] };
  const sources = body.sources ?? ['fourthwall', 'gumroad'];

  const results: SyncResult[] = [];

  if (sources.includes('fourthwall')) {
    results.push(await syncFourthwall());
  }
  if (sources.includes('gumroad')) {
    results.push(await syncGumroad());
  }

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  return NextResponse.json({
    success: totalErrors === 0,
    totalSynced,
    totalErrors,
    results,
  });
}
