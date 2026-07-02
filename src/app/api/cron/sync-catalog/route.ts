import { NextResponse } from 'next/server';

/**
 * Same sync logic as /api/admin/sync, triggered automatically instead of
 * by an admin click. Configured to run nightly via Vercel Cron — see
 * vercel.json. Vercel signs cron requests with a bearer token matching
 * CRON_SECRET automatically; no separate setup needed beyond setting that
 * env var.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL is not set' }, { status: 500 });
  }

  // Delegate to the same sync logic as the admin-triggered route rather
  // than duplicating it. This is a same-deployment call, so latency is
  // minimal, and it keeps exactly one implementation of the actual sync
  // logic to maintain.
  const response = await fetch(`${siteUrl}/api/admin/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Internal call, not an admin browser session — the admin route
      // itself only checks for a logged-in admin user, which a cron job
      // can never provide. A dedicated internal bypass is simplest here:
      'x-cron-secret': process.env.CRON_SECRET ?? '',
    },
    body: JSON.stringify({ sources: ['fourthwall', 'gumroad'] }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
