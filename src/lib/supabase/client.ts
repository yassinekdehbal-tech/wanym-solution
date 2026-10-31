import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;
let warned = false;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Read-only client (anon key, RLS applies). Safe for cached server reads.
 * Returns null when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are missing so the
 * site still builds (with empty content) before the environment is configured.
 */
export function supabasePublic(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    if (!warned) {
      warned = true;
      console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing: content will be empty");
    }
    return null;
  }
  if (!publicClient) publicClient = createClient(env.supabaseUrl, env.supabaseAnonKey, options);
  return publicClient;
}

/** Service-role client: server only, never import from a client component. */
export function supabaseAdmin(): SupabaseClient {
  if (!env.supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!env.supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!adminClient) adminClient = createClient(env.supabaseUrl, env.supabaseServiceKey, options);
  return adminClient;
}
