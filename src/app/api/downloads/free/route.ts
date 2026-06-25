import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedUrl } from '@/lib/supabase/storage';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const downloadId = searchParams.get('download_id');

    if (!downloadId) {
      return NextResponse.json({ error: 'Missing download_id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: download, error } = await supabase
      .from('downloads')
      .select('id, price_cents, file_path')
      .eq('id', downloadId)
      .single();

    if (error || !download) {
      return NextResponse.json({ error: 'Download not found' }, { status: 404 });
    }

    if (download.price_cents !== 0) {
      return NextResponse.json({ error: 'This download is not free' }, { status: 403 });
    }

    const signedUrl = await getSignedUrl('downloads', download.file_path, 3600);

    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
