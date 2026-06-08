import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { BrandMark } from "@/components/BrandMark";
import { ConfigNotice } from "@/components/ConfigNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string; error?: string }>;
}) {
  const { redirectedFrom, error } = await searchParams;
  const next = redirectedFrom?.startsWith("/") ? redirectedFrom : "/dashboard";

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(next);
  }

  return (
    <div className="bg-brand-radial flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 self-center">
          <BrandMark />
        </Link>
        <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xl shadow-black/5">
          <h1 className="text-2xl font-extrabold text-ink">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            Log in to keep your streak alive.
          </p>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Sorry, we couldn&apos;t sign you in. Please try again.
            </p>
          )}
          {isSupabaseConfigured ? (
            <AuthForm mode="login" next={next} />
          ) : (
            <ConfigNotice />
          )}
        </div>
      </div>
    </div>
  );
}
