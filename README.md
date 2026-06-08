# Bol Chaal · بول چال

> **"Everyday conversation."** A gamified web app that teaches conversational
> Urdu through live, voice-enabled dialogue with an AI tutor — Duolingo crossed
> with a real conversation partner.

Roman Urdu first (with Nastaʿlīq script a tap away), gentle corrections, and a
tight daily loop of streaks + XP. Every level ends in a **real back-and-forth
conversation**, not a multiple-choice quiz.

---

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------ |
| Framework    | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4       |
| Auth + DB    | Supabase (Postgres + Row Level Security)                     |
| AI tutor     | Anthropic Claude (server-side only) — _Phase 1_              |
| Voice        | Azure Speech TTS/STT, swappable behind a service — _Phase 3_ |
| PWA / Deploy | Installable PWA · Vercel                                      |

All third-party API calls run through **server routes** — secret keys are never
shipped to the browser.

> ⚠️ This repo uses **Next.js 16**, which renames `middleware.ts` → `proxy.ts`
> and makes `cookies()`/`headers()` **async-only**. See `AGENTS.md`.

---

## Build phases

- **Phase 0 — Scaffold ✅ (you are here):** Next + TS + Tailwind + Supabase
  client, PWA config, email/Google auth, automatic profile creation.
- **Phase 1 —** Conversation engine (`/api/tutor`, text only).
- **Phase 2 —** Gamification (XP, streaks, hearts, level map, achievements).
- **Phase 3 —** Voice (`/api/tts`, `/api/stt`, push-to-talk).
- **Phase 4 —** Viral/social (share cards, referrals, weekly leagues).
- **Phase 5 —** Polish, onboarding, deploy.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Make a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and the **anon
   public** key.
3. Open the **SQL Editor** and run the contents of
   [`supabase/migrations/0001_profiles.sql`](supabase/migrations/0001_profiles.sql).
   This creates the `profiles` table, its RLS policies, and a trigger that
   auto-creates a profile row on sign-up.

> **Faster local testing:** in **Authentication → Providers → Email**, turn
> **off** "Confirm email" so you can log in immediately after signing up.
> (With it on, you'll get a "check your email" screen — that's expected.)
>
> **Google login (optional):** enable the Google provider under
> **Authentication → Providers** and add `…/auth/callback` to the redirect
> URLs. Email/password works without this.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in at least these (Phase 0):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The app runs without keys (you'll see a friendly "finish setup" notice), but
auth needs them.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Verify Phase 0:** go to **Sign up** → create an account → you land on
`/dashboard`, which greets you and shows your fresh profile (Level 1, 0 XP, 5
hearts). Log out from the dashboard. ✅

---

## Project structure

```
app/
  page.tsx                 Landing page
  login/ · signup/         Auth screens
  dashboard/               Signed-in home (proves Phase 0)
  auth/callback/route.ts   OAuth + email-confirm code exchange
  auth/signout/route.ts    Sign out (clears cookies server-side)
  manifest.ts              PWA manifest  ·  icon.png / apple-icon.png
components/                BrandMark, AuthForm, GoogleButton, …
lib/
  supabase/                client / server / proxy session helpers
  levels.ts                The 8 conversational levels (source of truth)
  profile.ts               ensureProfile() safety net
proxy.ts                   Session refresh + route guard (Next 16 middleware)
public/sw.js · icons/      Service worker + PWA icons
supabase/migrations/       SQL schema
scripts/gen-icons.mjs      Regenerate PWA icons (no deps)
```

## Useful commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
node scripts/gen-icons.mjs   # regenerate PWA icons
```
