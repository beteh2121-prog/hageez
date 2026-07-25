import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AffiliateClickSchema } from '@/lib/validations/affiliate';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = AffiliateClickSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { book_id, session_id, referrer_url, marketplace } = parsed.data;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(ip + (process.env.IP_HASH_SALT ?? ''))
  );
  const ipHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const serviceClient = createServiceClient();

  const { count } = await serviceClient
    .from('affiliate_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('book_id', book_id)
    .eq('session_id', session_id)
    .gt('clicked_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

  if (count && count > 0) {
    return NextResponse.json({ tracked: false, reason: 'duplicate' });
  }

  const { data: book } = await serviceClient.from('kdp_books').select('id').eq('id', book_id).single();

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 400 });
  }

  const { error: insertError } = await serviceClient.from('affiliate_clicks').insert({
    book_id,
    user_id: session?.user.id ?? null,
    session_id,
    referrer_url: referrer_url ?? null,
    user_agent: request.headers.get('user-agent') ?? null,
    ip_hash: ipHash,
    marketplace,
  });

  if (insertError) {
    console.error('Failed to log affiliate click:', insertError.message);
  }

  // Never block navigation for a tracking failure.
  return NextResponse.json({ tracked: true });
}
