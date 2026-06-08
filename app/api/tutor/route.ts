import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";
import { runTutor, TutorError, type TutorTurn } from "@/lib/tutor";
import { getLevel } from "@/lib/levels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 60;
const MAX_CONTENT_CHARS = 2000;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

type Body = {
  levelId?: number;
  messages?: unknown;
  sessionXp?: number;
};

function parseMessages(raw: unknown): TutorTurn[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) {
    return null;
  }
  const out: TutorTurn[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_CONTENT_CHARS) return null;
    out.push({ role, content: trimmed });
  }
  // A conversation turn must end with the learner speaking.
  if (out[out.length - 1].role !== "user") return null;
  return out;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Basic per-user rate limiting.
  const limit = rateLimit(`tutor:${user.id}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many messages. Take a breath and try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (!isAnthropicConfigured) {
    return NextResponse.json(
      { error: "The AI tutor isn't configured yet. Add ANTHROPIC_API_KEY to enable conversations." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const level = typeof body.levelId === "number" ? getLevel(body.levelId) : undefined;
  if (!level) return badRequest("Unknown level.");

  const messages = parseMessages(body.messages);
  if (!messages) return badRequest("Invalid conversation history.");

  const sessionXp =
    typeof body.sessionXp === "number" && body.sessionXp >= 0
      ? Math.min(body.sessionXp, 100_000)
      : 0;

  // Call the tutor.
  let reply;
  try {
    reply = await runTutor({
      level: level.id,
      scenario: level.scenario,
      messages,
    });
  } catch (err) {
    if (err instanceof TutorError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("tutor route: unexpected error", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }

  const newSessionXp = sessionXp + reply.xp_awarded;
  const today = new Date().toISOString().slice(0, 10);

  // Persist side-effects best-effort: a DB hiccup must not drop the reply.
  let totalXp: number | null = null;
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", user.id)
      .maybeSingle();
    totalXp = (prof?.total_xp ?? 0) + reply.xp_awarded;
    await supabase
      .from("profiles")
      .update({ total_xp: totalXp, last_active_date: today })
      .eq("id", user.id);
  } catch (err) {
    console.error("tutor route: XP banking failed", err);
  }

  if (reply.new_vocab.length > 0) {
    try {
      const rows = reply.new_vocab
        .filter((v) => v.roman.trim())
        .map((v) => ({
          user_id: user.id,
          word_roman: v.roman.trim(),
          word_script: v.script || null,
          meaning_en: v.meaning_en || null,
        }));
      if (rows.length > 0) {
        await supabase
          .from("vocab_progress")
          .upsert(rows, { onConflict: "user_id,word_roman", ignoreDuplicates: true });
      }
    } catch (err) {
      console.error("tutor route: vocab save failed", err);
    }
  }

  if (reply.scenario_complete) {
    try {
      await supabase.from("conversation_logs").insert({
        user_id: user.id,
        level_id: level.id,
        transcript: [...messages, { role: "assistant", content: reply.reply_roman }],
        score: newSessionXp,
      });
    } catch (err) {
      console.error("tutor route: conversation log failed", err);
    }
  }

  return NextResponse.json({
    ...reply,
    total_xp: totalXp,
    session_xp: newSessionXp,
  });
}
