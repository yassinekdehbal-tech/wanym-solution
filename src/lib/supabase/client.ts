import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Read-only client (anon key, RLS applies). Safe for cached server reads. */
export function supabasePublic(): SupabaseClient {
  if (!publicClient) publicClient = createClient(env.supabaseUrl, env.supabaseAnonKey, options);
  return publicClient;
}

/** Service-role client: server only, never import from a client component. */
export function supabaseAdmin(): SupabaseClient {
  if (!env.supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!adminClient) adminClient = createClient(env.supabaseUrl, env.supabaseServiceKey, options);
  return adminClient;
}
