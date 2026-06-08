import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { LogoutButton } from "@/components/LogoutButton";
import { ConfigNotice } from "@/components/ConfigNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { getLevel, TOTAL_LEVELS } from "@/lib/levels";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="bg-brand-radial flex min-h-dvh items-center justify-center px-5">
        <ConfigNotice />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);
  const level = getLevel(profile?.current_level ?? 1);
  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "friend";

  return (
    <div className="bg-brand-radial min-h-dvh">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <BrandMark />
        <LogoutButton />
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-16">
        <h1 className="text-2xl font-extrabold text-ink">
          As-salaam alaikum, {name}! 👋
        </h1>
        <p className="mt-1 text-muted">Welcome to Bol Chaal. You&apos;re all set.</p>

        {!profile && (
          <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-5 text-sm text-ink">
            <p className="font-bold">Almost there — create the database tables.</p>
            <p className="mt-1 text-muted">
              Your account exists, but the <code>profiles</code> table is
              missing. Run{" "}
              <code className="rounded bg-black/5 px-1">
                supabase/migrations/0001_profiles.sql
              </code>{" "}
              in the Supabase SQL editor, then refresh.
            </p>
          </div>
        )}

        {/* Stat row */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Level" value={`${profile?.current_level ?? 1}`} icon="🎯" />
          <Stat label="XP" value={`${profile?.total_xp ?? 0}`} icon="⭐" />
          <Stat label="Streak" value={`${profile?.streak_count ?? 0}`} icon="🔥" />
          <Stat label="Hearts" value={`${profile?.hearts ?? 5}`} icon="❤️" />
        </section>

        {/* Today's lesson */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Today&apos;s lesson
          </h2>
          <div className="mt-3 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="flex items-center gap-4 p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-3xl">
                {level?.emoji ?? "👋"}
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
                  Level {level?.id ?? 1} of {TOTAL_LEVELS}
                </p>
                <p className="text-lg font-extrabold text-ink">
                  {level?.title ?? "Salaam"}{" "}
                  <span className="font-urdu text-base text-brand-dark" dir="rtl">
                    {level?.titleScript}
                  </span>
                </p>
                <p className="text-sm text-muted">{level?.blurb}</p>
              </div>
            </div>
            <div className="border-t border-black/5 bg-zinc-50 px-6 py-4">
              <Link
                href={`/learn/${level?.id ?? 1}`}
                className="block w-full rounded-xl bg-brand px-4 py-3 text-center text-base font-bold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Start conversation →
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-muted">
          Signed in as {user.email}
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="text-xl font-extrabold text-ink">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}
