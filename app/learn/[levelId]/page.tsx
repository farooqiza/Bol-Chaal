import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { getLevel } from "@/lib/levels";
import { Conversation } from "@/components/conversation/Conversation";
import { ConfigNotice } from "@/components/ConfigNotice";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ levelId: string }>;
}): Promise<Metadata> {
  const { levelId } = await params;
  const level = getLevel(Number(levelId));
  return { title: level ? `Level ${level.id}: ${level.title}` : "Lesson" };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <main className="bg-brand-radial flex min-h-dvh items-center justify-center px-5">
        <ConfigNotice />
      </main>
    );
  }

  const { levelId } = await params;
  const level = getLevel(Number(levelId));
  if (!level) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(supabase, user);

  return (
    <Conversation
      level={level}
      showScript={profile?.show_script ?? false}
      initialTotalXp={profile?.total_xp ?? 0}
      userId={user.id}
    />
  );
}
