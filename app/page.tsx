import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { LEVELS } from "@/lib/levels";
import { APP_NAME_URDU } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Auth-aware (reads the session cookie), so render per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  let signedIn = false;
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <div className="bg-brand-radial flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <BrandMark />
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Continue
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pb-16 text-center">
        <section className="flex max-w-2xl flex-col items-center pt-10 sm:pt-16">
          <span className="font-urdu mb-4 text-4xl text-brand-dark" dir="rtl">
            {APP_NAME_URDU}
          </span>
          <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Learn to actually <span className="text-brand">talk</span> in Urdu.
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted">
            Every level ends in a real, voice-enabled conversation with your AI
            tutor — not a multiple-choice quiz. Build a daily streak, earn XP,
            and go from <em>“Salaam”</em> to telling a whole story.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={signedIn ? "/dashboard" : "/signup"}
              className="rounded-2xl bg-brand px-7 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-brand-dark"
            >
              {signedIn ? "Continue learning" : "Start learning free"}
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-black/10 bg-white px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-zinc-50"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-16 w-full">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Your journey · 8 levels
          </h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LEVELS.map((level) => (
              <li
                key={level.id}
                className="flex flex-col items-start gap-2 rounded-2xl border border-black/5 bg-white/80 p-4 text-left shadow-sm backdrop-blur"
              >
                <span className="text-2xl" aria-hidden>
                  {level.emoji}
                </span>
                <span className="text-sm font-bold text-ink">
                  {level.id}. {level.title}
                </span>
                <span className="text-xs leading-snug text-muted">
                  {level.blurb}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-6 text-center text-xs text-muted">
        Roman Urdu first, with Nastaʿlīq script a tap away. Built for daily
        practice.
      </footer>
    </div>
  );
}
