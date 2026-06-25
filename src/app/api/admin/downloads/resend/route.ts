import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedUrl } from '@/lib/supabase/storage';
import { deliverDownloadEmail } from '@/lib/email/deliverDownload';

interface ResendBody {
  download_id?: string;
  email?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

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

  const body = (await request.json().catch(() => null)) as ResendBody | null;
  const downloadId = body?.download_id;
  const email = body?.email;

  if (!downloadId || !email) {
    return NextResponse.json({ error: 'download_id and email are required' }, { status: 400 });
  }

  const { data: download, error } = await supabase
    .from('downloads')
    .select('file_path')
    .eq('id', downloadId)
    .single();

  if (error || !download) {
    return NextResponse.json({ error: 'Download not found' }, { status: 404 });
  }

  const signedUrl = await getSignedUrl('downloads', download.file_path, 259200);
  const result = await deliverDownloadEmail({ downloadId, email, signedUrl });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Delivery failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
