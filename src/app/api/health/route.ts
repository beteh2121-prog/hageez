import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sanityClient } from '@/lib/sanity/client';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'FOURTHWALL_WEBHOOK_SECRET',
  'FOURTHWALL_STORE_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const;

function checkEnvVars(): CheckResult {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  return {
    name: 'Environment variables',
    ok: missing.length === 0,
    detail: missing.length === 0 ? 'All required env vars are set.' : `Missing: ${missing.join(', ')}`,
  };
}

async function checkSupabase(): Promise<CheckResult> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    if (error) {
      return { name: 'Supabase', ok: false, detail: `Query failed: ${error.message}` };
    }
    return { name: 'Supabase', ok: true, detail: 'Connected and queried profiles table successfully.' };
  } catch (err) {
    return {
      name: 'Supabase',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error constructing client.',
    };
  }
}

async function checkSanity(): Promise<CheckResult> {
  try {
    const result = await sanityClient.fetch<number>('count(*[_type == "post"])');
    return { name: 'Sanity', ok: true, detail: `Connected. ${result} post document(s) found.` };
  } catch (err) {
    return {
      name: 'Sanity',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error querying Sanity.',
    };
  }
}

export async function GET(): Promise<NextResponse> {
  const [envCheck, supabaseCheck, sanityCheck] = await Promise.all([
    Promise.resolve(checkEnvVars()),
    checkSupabase(),
    checkSanity(),
  ]);

  const checks = [envCheck, supabaseCheck, sanityCheck];
  const allOk = checks.every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
