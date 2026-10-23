// Supabase client for Client Components (code that runs in the browser).
// Not used yet in Phase 2 — all auth runs on the server — but later phases
// (e.g. live seat counts) will need it.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
