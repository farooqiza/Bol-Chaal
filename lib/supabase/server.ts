import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseConfig } from "./config";
import type { Database } from "@/types/database";

/**
 * Server Supabase client for Server Components, Route Handlers and Server Actions.
 * In Next.js 16 `cookies()` is async and must be awaited.
 */
export async function createClient() {
  const { url, anonKey } = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component. This can be ignored
          // when the session is refreshed by proxy.ts (the middleware equivalent).
        }
      },
    },
  });
}
