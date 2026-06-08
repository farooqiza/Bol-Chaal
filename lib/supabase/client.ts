import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "./config";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client. Use inside Client Components only.
 * Reads/writes the auth session from cookies via the @supabase/ssr adapter.
 */
export function createClient() {
  const { url, anonKey } = requireSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
