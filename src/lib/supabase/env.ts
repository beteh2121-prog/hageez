/**
 * Validated accessors for the Supabase env vars. Every Supabase client in
 * this project should go through these instead of reading
 * process.env.NEXT_PUBLIC_SUPABASE_URL directly.
 *
 * This exists because of a real incident: NEXT_PUBLIC_SUPABASE_URL was set
 * to "https://xxxx.supabase.co/rest/v1/" (a path appended to what should
 * be a bare project URL) in Vercel's environment variables. The Supabase
 * client builds its own path on top of whatever URL it's given, so the
 * extra segment produced a confusing `PGRST125 — Invalid path specified`
 * error deep inside PostgREST, with no indication of *which* env var was
 * actually wrong. Validating once, here, turns that into one clear error
 * message at the point of use instead.
 */

function assertNoPath(url: string, varName: string): string {
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${varName} is not a valid URL: "${trimmed}"`);
  }

  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new Error(
      `${varName} should be the bare project URL with no path — e.g. "https://xxxx.supabase.co". ` +
        `Got "${trimmed}", which has "${parsed.pathname}" appended. Remove everything after ".supabase.co".`
    );
  }

  // Normalize: drop any trailing slash so every caller gets a consistent value.
  return trimmed.replace(/\/+$/, '');
}

export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
  }
  return assertNoPath(raw, 'NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!raw) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  }
  return raw.trim();
}

export function getSupabaseServiceRoleKey(): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return raw.trim();
}
