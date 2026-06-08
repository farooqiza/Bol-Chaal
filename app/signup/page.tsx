import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { BrandMark } from "@/components/BrandMark";
import { ConfigNotice } from "@/components/ConfigNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create your account" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <div className="bg-brand-radial flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <Link href="/" className="mb-8 self-center">
          <BrandMark />
        </Link>
        <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xl shadow-black/5">
          <h1 className="text-2xl font-extrabold text-ink">
            Start speaking Urdu
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            Create a free account — your first conversation is minutes away.
          </p>
          {isSupabaseConfigured ? (
            <AuthForm mode="signup" />
          ) : (
            <ConfigNotice />
          )}
        </div>
      </div>
    </div>
  );
}
