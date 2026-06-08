import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Profile } from "@/types/database";

export const DEFAULT_VOICE = "ur-PK-UzmaNeural";
export const STARTING_HEARTS = 5;

function defaultDisplayName(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email?.split("@")[0] ??
    null
  );
}

/**
 * Returns the signed-in user's profile, creating an empty one on first visit.
 *
 * A Postgres trigger (see supabase/migrations) normally creates this row at
 * sign-up. This function is a safety net so the app works even if the trigger
 * has not been installed yet. RLS allows a user to insert their own row.
 */
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<Profile | null> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("ensureProfile: select failed", selectError.message);
  }
  if (existing) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: defaultDisplayName(user),
      preferred_voice: DEFAULT_VOICE,
      hearts: STARTING_HEARTS,
    })
    .select("*")
    .maybeSingle();

  if (insertError) {
    // Likely the trigger already created it in a race, or RLS/migration is missing.
    console.error("ensureProfile: insert failed", insertError.message);
    const { data: retry } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return retry ?? null;
  }

  return inserted ?? null;
}
