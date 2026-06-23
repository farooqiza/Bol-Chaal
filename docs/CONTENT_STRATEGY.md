# Content Strategy & Playbook

The organic social-media plan for Bright Stars. The AI follows this playbook;
this doc explains the thinking so a human can steer it.

## Goal

**Fill open enrollment slots** (infants, toddlers, preschool) and **recruit
teachers.** Social media for childcare is a *trust* engine — parents choose with
their hearts, then justify with their heads. Every post should build trust and
make the next step (a tour, a call, a message) easy.

## Platform roles

| Platform | Job | Cadence | Audience |
|---|---|---|---|
| **Facebook** | Primary enrollment + community channel. Reviews, events, local parent groups. | ~3×/week | Aurora parents, 25–45 (esp. moms) |
| **Instagram** | Visual trust-building + reach. Reels for discovery. | ~3×/week | Younger millennial / Gen-Z parents |
| **LinkedIn** | Hiring + employer brand **only**. | ~1×/week | Early-childhood educators, local |

**Honest note on LinkedIn:** for a single-location daycare it does little for
*enrollment*. We use it purely to recruit staff and show workplace culture. Keep
it low-effort; don't chase it.

## Content pillars (the rotation)

1. **Parenting & Early-Learning Tips** — genuinely useful, highly shareable.
2. **Inside Our Classrooms** — curriculum in action (materials/activities, not faces).
3. **Meet the Team** — humanize + double as employer branding.
4. **Why Bright Stars** — Level 4 rating, low ratios, CACFP meals, kindergarten readiness.
5. **Enrollment & Affordability** — open spots, UPK/DPP/CCCAP, tour invites.
6. **Community & Seasonal** — timely, local, feel-good.
7. **We're Hiring / Culture** — recruiting (mostly LinkedIn + Facebook).

The scheduler rotates these automatically so the month stays balanced and fresh.

## Voice

Warm, nurturing, trustworthy, parent-to-parent. Like a caring teacher talking to
a parent — never a billboard. No hype, no ALL CAPS, no guarantees or medical
claims. Light on emoji and hashtags. (Full voice spec lives in `config/brand.yaml`.)

## What good looks like

- Leads with the parent's or child's benefit, then a gentle call to action.
- Local: mentions Aurora / nearby neighborhoods where natural.
- One clear next step per post (tour, message, call, apply).
- Visuals that need **no** consent by default; real photos only with releases.

## Measuring it (later phase)

Watch a few simple numbers monthly: reach, saves/shares (tips travel), profile
visits, and — most importantly — **tour requests and calls** mentioning social.
Double down on the pillars that drive inquiries. (A reporting step using Meta
Insights / Windsor.ai can be added once posting is consistent.)

## Tuning the plan

Everything is data-driven from `config/brand.yaml`:

- Change cadence → edit each platform's `weekly_posts`.
- Add/retire a pillar → edit the `pillars` list (and the platform `pillars` lists).
- Adjust voice, hashtags, CTAs, or business facts → edit those sections.

No code changes needed — regenerate the month and the new plan flows through.
