import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

/**
 * SERVER ONLY — uses the service role key, which bypasses Row Level
 * Security. Never import this into a Client Component.
 */
export function createServiceClient(): SupabaseClient {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
}
