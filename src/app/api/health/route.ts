import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sanityClient } from '@/lib/sanity/client';
import { resolveCheckoutOrigin } from '@/lib/fourthwall/shop';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

// Server-side secrets are read at REQUEST time, so they must exist as
// variables/secrets on the Cloudflare Worker itself — GitHub secrets only
// cover the build step.
const RUNTIME_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'FOURTHWALL_STOREFRONT_TOKEN',
  'FOURTHWALL_WEBHOOK_SECRET',
  'GUMROAD_ACCESS_TOKEN',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'IP_HASH_SALT',
] as const;

function checkRuntimeSecrets(): CheckResult {
  const missing = RUNTIME_SECRETS.filter((name) => !process.env[name]);
  return {
    name: 'Worker runtime secrets',
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? 'All runtime secrets are set on the Worker.'
        : `Missing on the Worker: ${missing.join(', ')}. Add them in Cloudflare → Workers → Settings → Variables and Secrets (type: Secret).`,
  };
}

// Static references on purpose: Next inlines NEXT_PUBLIC_* at build time, but
// only for literal `process.env.NEXT_PUBLIC_X` expressions.
function checkBuildConfig(): CheckResult {
  const present: Record<string, boolean> = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SANITY_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
    NEXT_PUBLIC_SITE_URL: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_FOURTHWALL_STORE_URL: Boolean(process.env.NEXT_PUBLIC_FOURTHWALL_STORE_URL),
  };
  const missing = Object.entries(present)
    .filter(([, isSet]) => !isSet)
    .map(([name]) => name);
  return {
    name: 'Build-time config',
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? 'All build-time values were baked into this deployment.'
        : `Not set when this deployment was built: ${missing.join(', ')}. Check the GitHub secret and the deploy workflow's env list.`,
  };
}

async function checkCatalog(): Promise<CheckResult> {
  try {
    const supabase = createServiceClient();
    const [merchActive, merchTotal, downloadsTotal, downloadsGumroad, booksPublished] = await Promise.all([
      supabase.from('merch').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('merch').select('id', { count: 'exact', head: true }),
      supabase.from('downloads').select('id', { count: 'exact', head: true }),
      supabase.from('downloads').select('id', { count: 'exact', head: true }).eq('source', 'gumroad'),
      supabase.from('kdp_books').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ]);

    const failed = [merchActive, merchTotal, downloadsTotal, downloadsGumroad, booksPublished].find(
      (result) => result.error
    );
    if (failed?.error) {
      return { name: 'Catalog (database)', ok: false, detail: `Query failed: ${failed.error.message}` };
    }

    const active = merchActive.count ?? 0;
    const summary =
      `merch ${active} active of ${merchTotal.count ?? 0} · ` +
      `downloads ${downloadsTotal.count ?? 0} (${downloadsGumroad.count ?? 0} from Gumroad) · ` +
      `books ${booksPublished.count ?? 0} published`;

    return {
      name: 'Catalog (database)',
      ok: active > 0,
      detail:
        active > 0
          ? summary
          : `${summary}. No active merch yet — run Admin → Settings → Catalog Sync → Sync Now.`,
    };
  } catch (err) {
    return {
      name: 'Catalog (database)',
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error reading the catalog.',
    };
  }
}

async function checkFourthwallCheckout(): Promise<CheckResult> {
  const { origin, source } = await resolveCheckoutOrigin();

  if (!origin) {
    return {
      name: 'Fourthwall checkout domain',
      ok: false,
      detail:
        'Could not determine the shop domain. Set FOURTHWALL_STOREFRONT_TOKEN as a Worker secret (preferred), or FOURTHWALL_STORE_URL as a fallback.',
    };
  }

  return {
    name: 'Fourthwall checkout domain',
    ok: true,
    detail:
      source === 'fourthwall-api'
        ? `${origin} (read live from Fourthwall).`
        : `${origin} (from the FOURTHWALL_STORE_URL fallback — add FOURTHWALL_STOREFRONT_TOKEN to read it live).`,
  };
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
  const [catalogCheck, sanityCheck, checkoutCheck] = await Promise.all([
    checkCatalog(),
    checkSanity(),
    checkFourthwallCheckout(),
  ]);
  const checks = [checkBuildConfig(), checkRuntimeSecrets(), checkoutCheck, catalogCheck, sanityCheck];
  const allOk = checks.every((check) => check.ok);

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
