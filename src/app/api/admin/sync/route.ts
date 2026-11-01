import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncFourthwall, syncGumroad, type Source, type SyncResult } from '@/lib/sync/catalog';

export const dynamic = 'force-dynamic';

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
 * Fallback for small catalogs. The admin button now starts the GitHub Actions
 * job instead (see /api/admin/sync/trigger), which has no Worker limits.
 */
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
      { error: err instanceof Error ? err.message : 'Catalog sync crashed unexpectedly.' },
      { status: 500 }
    );
  }
}
