"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/BrandMark";
import type { Level } from "@/lib/levels";

type Vocab = { roman: string; script: string; meaning_en: string };

type FeedItem =
  | { id: string; kind: "user"; text: string }
  | {
      id: string;
      kind: "tutor";
      roman: string;
      script: string;
      english: string;
      correction: string | null;
      vocab: Vocab[];
      xp: number;
    };

type TutorTurn = { role: "user" | "assistant"; content: string };

type TutorApiResponse = {
  reply_roman: string;
  reply_script: string;
  reply_english: string;
  correction: string | null;
  new_vocab: Vocab[];
  xp_awarded: number;
  scenario_complete: boolean;
  total_xp: number | null;
  session_xp: number;
};

// Hidden first message so the tutor opens the conversation in character.
const KICKOFF =
  "(The learner just opened this lesson. Greet them warmly in simple Urdu and start the scenario with one short, easy question.)";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function Conversation({
  level,
  showScript,
  initialTotalXp,
  userId,
}: {
  level: Level;
  showScript: boolean;
  initialTotalXp: number;
  userId: string;
}) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [apiHistory, setApiHistory] = useState<TutorTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionXp, setSessionXp] = useState(0);
  const [totalXp, setTotalXp] = useState(initialTotalXp);
  const [scriptOn, setScriptOn] = useState(showScript);
  const [completed, setCompleted] = useState(false);

  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionXpRef = useRef(0);
  useEffect(() => {
    sessionXpRef.current = sessionXp;
  }, [sessionXp]);

  const vocabCount = feed.reduce(
    (n, item) => (item.kind === "tutor" ? n + item.vocab.length : n),
    0,
  );

  const callTutor = useCallback(
    async (history: TutorTurn[]): Promise<TutorApiResponse> => {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level.id,
          messages: history,
          sessionXp: sessionXpRef.current,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      return data as TutorApiResponse;
    },
    [level.id],
  );

  const applyTutorReply = useCallback((data: TutorApiResponse) => {
    setFeed((f) => [
      ...f,
      {
        id: uid(),
        kind: "tutor",
        roman: data.reply_roman,
        script: data.reply_script,
        english: data.reply_english,
        correction: data.correction,
        vocab: data.new_vocab ?? [],
        xp: data.xp_awarded,
      },
    ]);
    setSessionXp(data.session_xp);
    if (typeof data.total_xp === "number") setTotalXp(data.total_xp);
    if (data.scenario_complete) setCompleted(true);
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    setError(null);
    const history: TutorTurn[] = [{ role: "user", content: KICKOFF }];
    try {
      const data = await callTutor(history);
      setApiHistory([...history, { role: "assistant", content: data.reply_roman }]);
      applyTutorReply(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the lesson.");
    } finally {
      setLoading(false);
    }
  }, [callTutor, applyTutorReply]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [feed, loading, completed]);

  async function sendTurn() {
    const text = input.trim();
    if (!text || loading || completed) return;

    const userItemId = uid();
    setInput("");
    setError(null);
    setFeed((f) => [...f, { id: userItemId, kind: "user", text }]);
    setLoading(true);

    const newHistory: TutorTurn[] = [...apiHistory, { role: "user", content: text }];
    try {
      const data = await callTutor(newHistory);
      setApiHistory([...newHistory, { role: "assistant", content: data.reply_roman }]);
      applyTutorReply(data);
    } catch (e) {
      // Roll back the optimistic bubble and restore the text to edit/resend.
      setFeed((f) => f.filter((x) => x.id !== userItemId));
      setInput(text);
      setError(e instanceof Error ? e.message : "Message failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendTurn();
    }
  }

  async function toggleScript() {
    const next = !scriptOn;
    setScriptOn(next);
    try {
      await createClient().from("profiles").update({ show_script: next }).eq("id", userId);
    } catch {
      /* preference persistence is best-effort */
    }
  }

  return (
    <div className="bg-brand-radial flex h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-black/5"
          >
            ←
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Level {level.id} · {level.emoji}
            </p>
            <h1 className="-mt-0.5 text-base font-extrabold text-ink">
              {level.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent-dark">
              ⭐ {totalXp + sessionXp}
            </span>
            <button
              type="button"
              onClick={toggleScript}
              aria-pressed={scriptOn}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                scriptOn
                  ? "bg-brand text-white"
                  : "border border-black/10 bg-white text-muted"
              }`}
              title="Toggle Urdu script"
            >
              اردو
            </button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">
          <ScenarioCard level={level} vocabCount={vocabCount} />

          {feed.map((item) =>
            item.kind === "user" ? (
              <UserBubble key={item.id} text={item.text} />
            ) : (
              <TutorBubble key={item.id} item={item} scriptOn={scriptOn} />
            ),
          )}

          {loading && <TypingDots />}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {feed.length === 0 && (
                <button
                  type="button"
                  onClick={() => void start()}
                  className="mt-2 font-semibold underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {completed && (
            <CompletionCard sessionXp={sessionXp} totalXp={totalXp} levelId={level.id} />
          )}
        </div>
      </div>

      {/* Composer */}
      {!completed && (
        <div className="border-t border-black/5 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-end gap-2 px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={loading}
              placeholder="Type your reply in Roman Urdu…"
              className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void sendTurn()}
              disabled={loading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white transition hover:bg-brand-dark disabled:opacity-40"
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ level, vocabCount }: { level: Level; vocabCount: number }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4 text-center text-sm text-muted">
      <p className="font-semibold text-ink">{level.blurb}</p>
      <p className="mt-1">
        Chat with Ustaad-jee to finish the scenario.
        {vocabCount > 0 && ` · 📚 ${vocabCount} new word${vocabCount === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-white shadow-sm">
        {text}
      </div>
    </div>
  );
}

function TutorBubble({ item, scriptOn }: { item: Extract<FeedItem, { kind: "tutor" }>; scriptOn: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Logo className="mt-1 h-8 w-8 shrink-0" />
      <div className="max-w-[85%] space-y-2">
        <div className="rounded-2xl rounded-tl-md border border-black/5 bg-white px-4 py-3 shadow-sm">
          {scriptOn && (
            <p className="font-urdu mb-1 text-xl leading-relaxed text-ink" dir="rtl">
              {item.script}
            </p>
          )}
          <p className="font-semibold text-ink">{item.roman}</p>
          <p className="mt-0.5 text-sm text-muted">{item.english}</p>
        </div>

        {item.correction && (
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">
            <span className="font-bold text-accent-dark">💡 Tip: </span>
            {item.correction}
          </div>
        )}

        {item.vocab.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.vocab.map((v, i) => (
              <span
                key={`${v.roman}-${i}`}
                className="rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-xs text-ink"
                title={v.meaning_en}
              >
                <span className="font-semibold">{v.roman}</span>
                <span className="text-muted"> — {v.meaning_en}</span>
              </span>
            ))}
          </div>
        )}

        <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent-dark">
          +{item.xp} XP
        </span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo className="h-8 w-8 shrink-0" />
      <div className="flex gap-1 rounded-2xl rounded-tl-md border border-black/5 bg-white px-4 py-3.5 shadow-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
      </div>
    </div>
  );
}

function CompletionCard({
  sessionXp,
  totalXp,
  levelId,
}: {
  sessionXp: number;
  totalXp: number;
  levelId: number;
}) {
  return (
    <div className="rounded-3xl border border-brand/20 bg-white p-6 text-center shadow-sm">
      <div className="text-4xl">🎉</div>
      <h2 className="mt-2 text-xl font-extrabold text-ink">Shabaash!</h2>
      <p className="mt-1 text-muted">
        You finished this conversation and earned{" "}
        <strong className="text-accent-dark">+{sessionXp} XP</strong>.
      </p>
      <p className="mt-1 text-sm text-muted">Total XP: {totalXp}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard"
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          Back to dashboard
        </Link>
        <Link
          href={`/learn/${levelId}`}
          className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-zinc-50"
        >
          Practice again
        </Link>
      </div>
    </div>
  );
}
