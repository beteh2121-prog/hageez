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
      `${varName} must be the bare project URL with no path — ` +
      `e.g. "https://xxxx.supabase.co". Got "${trimmed}" which has ` +
      `"${parsed.pathname}" appended. Remove everything after ".supabase.co".`
    );
  }
  return trimmed.replace(/\/+$/, '');
}

export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
  return assertNoPath(raw, 'NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!raw) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  return raw.trim();
}

export function getSupabaseServiceRoleKey(): string {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  return raw.trim();
}
