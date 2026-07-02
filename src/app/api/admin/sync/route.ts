import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { slugify } from '@/lib/utils/slugify';
import {
  fetchAllFourthwallProducts,
  isDigitalProductByNaming,
  type FourthwallStorefrontProduct,
} from '@/lib/fourthwall/client';
import { fetchAllGumroadProducts, type GumroadProduct } from '@/lib/gumroad/client';

interface SyncResult {
  source: 'fourthwall' | 'gumroad';
  synced: number;
  errors: string[];
}

async function requireAdmin(request: Request): Promise<NextResponse | null> {
  // Internal bypass for the cron-triggered sync (src/app/api/cron/sync-
  // catalog/route.ts), which has no browser session to check.
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

function cleanProductName(name: string): string {
  // Strips the "[digital]" naming-convention marker (see
  // isDigitalProductByNaming) so it never shows up in the title displayed
  // on the storefront.
  return name.replace(/\[digital\]/gi, '').trim();
}

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
    const lowestPrice = product.variants.reduce<number | null>((min, variant) => {
      const value = variant.unitPrice.value;
      return min === null || value < min ? value : min;
    }, null);
    const priceCents = Math.round((lowestPrice ?? 0) * 100);
    const title = cleanProductName(product.name);
    const slug = slugify(title);
    const images = product.images.map((img) => ({ url: img.transformedUrl || img.url, alt: title }));

    try {
      if (isDigitalProductByNaming(product)) {
        const { error } = await supabase.from('downloads').upsert(
          {
            fourthwall_product_id: product.id,
            source: 'fourthwall',
            title,
            slug,
            description: product.description || null,
            price_cents: priceCents,
            cover_path: images[0]?.url ?? null,
          },
          { onConflict: 'fourthwall_product_id' }
        );
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('merch').upsert(
          {
            fourthwall_id: product.id,
            source: 'fourthwall',
            title,
            slug,
            description: product.description || null,
            price_cents: priceCents,
            images,
            status: product.state.type === 'SoldOut' ? 'archived' : 'active',
          },
          { onConflict: 'fourthwall_id' }
        );
        if (error) throw new Error(error.message);
      }
      result.synced += 1;
    } catch (err) {
      result.errors.push(`"${title}": ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  return result;
}

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
    if (!product.published) continue; // Skip drafts — nothing to show yet.

    const slug = slugify(product.name);

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
          external_url: product.url,
        },
        { onConflict: 'gumroad_product_id' }
      );
      if (error) throw new Error(error.message);
      result.synced += 1;
    } catch (err) {
      result.errors.push(`"${product.name}": ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  return result;
}

export async function POST(request: Request): Promise<NextResponse> {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const body = (await request.json().catch(() => ({}))) as { sources?: ('fourthwall' | 'gumroad')[] };
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
