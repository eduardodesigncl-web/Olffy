import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseAdminConfig } from "./admin-config";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const config = resolveSupabaseAdminConfig();

  adminClient = createClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return adminClient;
}
