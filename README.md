# Bright Stars — Organic Social Automation

AI-assisted organic content for **Bright Stars Child Care & Preschool**
([brightstars.us](https://www.brightstars.us)) across **Facebook**, **Instagram**,
and **LinkedIn** (hiring).

It drafts a month of on-brand posts with Claude, you approve them, and it
publishes the approved ones on schedule. **Nothing is posted without human
approval** — essential for a childcare center (see
[`docs/CHILD_SAFETY_POLICY.md`](docs/CHILD_SAFETY_POLICY.md)).

## How it works

```
generate ──▶ review ──▶ approve ──▶ publish-due
(AI draft)   (REVIEW.md) (you decide) (FB / IG / LinkedIn, only what's due)
```

- **Facebook + Instagram** drive enrollment (tours, inquiries, trust).
- **LinkedIn** is used only for hiring posts.
- Scheduling and pillar rotation are computed in code; the AI writes the creative.
- Everything is driven by [`config/brand.yaml`](config/brand.yaml) — edit that to
  change voice, cadence, pillars, hashtags, or business facts. No code changes needed.

## Quick start

```bash
pip install -r requirements.txt
export PYTHONPATH=src

# 1. See it work with no API key (offline templated sample):
python -m brightstars sample next

# 2. Real AI generation (needs ANTHROPIC_API_KEY in .env — see docs/SETUP.md):
python -m brightstars generate next

# 3. Review the drafts:
open content/<month>/REVIEW.md

# 4. Approve (all, or specific posts):
python -m brightstars approve <month> --all
python -m brightstars skip   <month> --ids 2026-07-04-facebook-07

# 5. Publish what's due — dry run first, then for real:
python -m brightstars publish-due <month>
python -m brightstars publish-due <month> --live
```

`<month>` is `YYYY-MM`, or `this` / `next`.

## Preview dashboard (recommended)

Prefer a visual workflow? Launch the **Content Studio** — a local web app to
preview posts, approve them with a click, and see analytics:

```bash
python -m brightstars serve          # then open http://127.0.0.1:8000
```

- **📊 Dashboard** — KPIs, posts by status/platform/pillar, posting cadence, and a
  performance section (live follower counts when Meta is connected; clearly-labeled
  *sample* engagement data until then, so it's useful before launch).
- **📱 Preview** — every post rendered as a realistic Facebook / Instagram / LinkedIn
  card, with **Approve / Skip** buttons and the consent note shown.
- **🗓️ Calendar** — a month grid showing what posts on which day, color-coded by platform.

First run with no content? The dashboard offers a one-click "Create sample month."

## What gets produced

For each month, `content/<month>/`:
- **`calendar.json`** — structured posts (date, platform, pillar, caption,
  hashtags, image idea, CTA, consent notes, status). The machine-readable record.
- **`REVIEW.md`** — a human-friendly view for reviewing and approving.

Each post carries a **consent/photo note** flagging what to check before it goes live.

## On autopilot

Two GitHub Actions workflows (see [`docs/SETUP.md`](docs/SETUP.md)):
- **Generate** (monthly) → drafts next month and opens a Pull Request to review.
- **Publish** (daily) → publishes that day's **approved** posts.

## Project layout

```
config/brand.yaml          # the brand knowledge base (single source of truth)
src/brightstars/           # the engine
  generator.py             #   Claude content generation (structured output)
  schedule.py              #   date/pillar scheduling
  publish.py + publishers/ #   Meta Graph API (FB/IG) + LinkedIn
  analytics.py             #   dashboard metrics
  web/                     #   Flask dashboard (server + static/ frontend)
  cli.py                   #   the commands above
docs/                      # CHILD_SAFETY_POLICY, CONTENT_STRATEGY, SETUP
.github/workflows/         # generate (monthly) + publish (daily)
content/<month>/           # generated calendars (kept as the record)
```

## Docs

- [`docs/CHILD_SAFETY_POLICY.md`](docs/CHILD_SAFETY_POLICY.md) — **read first.**
- [`docs/CONTENT_STRATEGY.md`](docs/CONTENT_STRATEGY.md) — the playbook & platform plan.
- [`docs/SETUP.md`](docs/SETUP.md) — API keys, Meta/LinkedIn setup, GitHub secrets.

## Notes

- Default model is `claude-opus-4-8` (override with `BRIGHTSTARS_MODEL`).
- Instagram requires a public `image_url` per post; Facebook can post text/links
  without one. See `docs/SETUP.md`.
- This is a v1 foundation: a reporting/analytics step (Meta Insights / Windsor.ai)
  and AI image generation are natural next additions.
