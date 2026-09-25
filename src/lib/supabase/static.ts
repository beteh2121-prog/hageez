import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

/**
 * For contexts with no HTTP request at all — generateStaticParams, build
 * scripts, etc. There is no cookie jar to read a session from at build
 * time, so the cookie-aware client from `server.ts` cannot be used here;
 * calling `cookies()` outside a real request throws. This client uses the
 * public anon key directly instead, which is safe because every query it
 * runs (active merch, public downloads metadata, published books) is
 * already readable by anonymous users under the existing RLS policies.
 */
export function createStaticClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey());
}
