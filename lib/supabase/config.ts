// Central place to read the public Supabase configuration.
// These are NEXT_PUBLIC_* values, so they are safe to expose to the browser.
// The server-only service-role key lives in lib/supabase/admin.ts and is never imported here.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when both public Supabase env vars are present.
 * The UI checks this so the app renders a friendly "add your keys" state
 * instead of crashing before the project is configured.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function requireSupabaseConfig(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}
