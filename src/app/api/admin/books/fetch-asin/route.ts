import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AsinSchema } from '@/lib/validations/books';

interface FetchAsinBody {
  asin?: string;
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

  const body = (await request.json().catch(() => null)) as FetchAsinBody | null;
  const parsed = AsinSchema.safeParse(body?.asin);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid ASIN format' }, { status: 400 });
  }

  if (!process.env.AMAZON_PA_API_ACCESS_KEY) {
    return NextResponse.json({
      error: 'PA_API_UNAVAILABLE',
      message: 'Amazon PA-API requires 3 qualifying sales first. Enter book details manually.',
      manualEntryRequired: true,
    });
  }

  // PA-API GetItems call (AWS Signature V4) goes here once credentials are
  // active. It's intentionally not implemented yet: Amazon only issues
  // PA-API credentials after 3 qualifying sales, so this call cannot be
  // built against real, testable credentials until that gate is cleared.
  // Manual entry (below) is the fully working path until then.
  return NextResponse.json({
    error: 'PA_API_NOT_IMPLEMENTED',
    message: 'PA-API credentials detected but the GetItems integration is not yet wired up.',
    manualEntryRequired: true,
  });
}
