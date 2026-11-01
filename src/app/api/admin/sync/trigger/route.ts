import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const REPO = 'beteh2121-prog/hageez';
const WORKFLOW = 'nightly-catalog-sync.yml';
const BRANCH = 'main';

export async function POST(): Promise<NextResponse> {
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

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'GITHUB_DISPATCH_TOKEN is not set on the Worker (type: Secret).' },
      { status: 503 }
    );
  }

  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'hageez-admin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: BRANCH }),
    cache: 'no-store',
  });

  if (res.status !== 204) {
    return NextResponse.json(
      { error: `GitHub refused to start the sync (HTTP ${res.status}). Check the token's permissions.` },
      { status: 502 }
    );
  }
  return NextResponse.json({ started: true });
}
