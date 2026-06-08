-- Bol Chaal — Phase 1 schema: vocab + conversation logs
-- Run in the Supabase SQL editor after 0001. Safe to re-run.

-- ── Vocabulary progress (spaced repetition, SM-2 fields) ──────────────────
create table if not exists public.vocab_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  word_roman    text not null,
  word_script   text,
  meaning_en    text,
  strength      int  not null default 0,   -- 0..5 (SM-2 repetition quality bucket)
  ease_factor   real not null default 2.5, -- SM-2 EF
  interval_days int  not null default 0,   -- SM-2 interval
  next_review_at timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, word_roman)
);

create index if not exists vocab_progress_due_idx
  on public.vocab_progress (user_id, next_review_at);

alter table public.vocab_progress enable row level security;

drop policy if exists "Vocab is owned by the user" on public.vocab_progress;
create policy "Vocab is owned by the user"
  on public.vocab_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists vocab_progress_set_updated_at on public.vocab_progress;
create trigger vocab_progress_set_updated_at
  before update on public.vocab_progress
  for each row execute function public.set_updated_at();

-- ── Conversation logs ─────────────────────────────────────────────────────
create table if not exists public.conversation_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  level_id    int  not null,
  transcript  jsonb not null default '[]'::jsonb,
  score       int   not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists conversation_logs_user_idx
  on public.conversation_logs (user_id, created_at desc);

alter table public.conversation_logs enable row level security;

drop policy if exists "Conversation logs are owned by the user" on public.conversation_logs;
create policy "Conversation logs are owned by the user"
  on public.conversation_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
