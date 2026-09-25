import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

/**
 * SERVER ONLY — uses the service role key, which bypasses Row Level
 * Security. Never import this into a Client Component.
 *
 * Centralized here because it was previously duplicated verbatim in the
 * Fourthwall webhook route, the affiliate-tracking route, and the email
 * delivery helper — three copies of the same env-var reading code, which
 * is exactly the kind of duplication that let an env var typo go
 * unvalidated in some call sites.
 */
export function createServiceClient(): SupabaseClient {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
}
