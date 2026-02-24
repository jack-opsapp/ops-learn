import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for server-side use.
 * Uses service role key when available (bypasses RLS for enrollment writes).
 * Falls back to anon key for read-only queries (e.g. during build).
 */
export function createServiceClient() {
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).trim();

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    key
  );
}
