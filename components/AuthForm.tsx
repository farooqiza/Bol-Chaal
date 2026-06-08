"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/constants";
import { GoogleButton } from "./GoogleButton";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  next = "/dashboard",
}: {
  mode: Mode;
  next?: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : SITE_URL;

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;

        // If email confirmation is enabled there is a user but no session yet.
        if (data.user && !data.session) {
          setCheckEmail(true);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-2xl">
          ✉️
        </div>
        <h2 className="text-lg font-bold text-ink">Check your email</h2>
        <p className="mt-1 text-sm text-muted">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then log in.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-semibold text-brand-dark underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            placeholder={isSignup ? "At least 6 characters" : "Your password"}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand px-4 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : isSignup
              ? "Create account"
              : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs font-medium text-muted">
        <span className="h-px flex-1 bg-black/10" />
        OR
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton next={next} />

      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>
            Already learning?{" "}
            <Link href="/login" className="font-semibold text-brand-dark underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-brand-dark underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
