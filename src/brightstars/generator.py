"""AI content generation via the Claude API (structured output)."""
from __future__ import annotations

import json
import os

from .config import Settings, load_brand
from .models import DraftCalendar
from .schedule import build_slots

SYSTEM = """You are the social media manager for Bright Stars Child Care & Preschool, \
a Level 4-rated childcare center in Aurora, Colorado. You write warm, trustworthy \
organic social posts that help local parents choose Bright Stars and help recruit \
great teachers.

NON-NEGOTIABLE CHILD-SAFETY RULES (a childcare center lives or dies on these):
- Never depict or describe an identifiable, named, or specific enrolled child.
- image_prompt must describe visuals with NO children's faces: classrooms,
  materials, children's art (no faces), teachers (with consent), illustrations,
  or stock imagery.
- Never reveal a child's schedule, location specifics, or anything that could
  identify a specific family.
- In every post's `notes`, state the consent/photo check the human must do first
  (or write "No consent needed").

Write like a caring teacher talking to a parent — never like an ad. No hype, no
ALL CAPS, no guarantees, no medical or developmental claims. Be genuinely helpful.
Quality over quantity on emoji and hashtags."""


def _pillar_index(brand: dict) -> dict:
    return {p["id"]: p for p in brand.get("pillars", [])}


def build_user_prompt(brand: dict, year: int, month: int, slots) -> str:
    pi = _pillar_index(brand)
    slot_lines = []
    for i, s in enumerate(slots):
        p = pi.get(s.pillar, {})
        slot_lines.append({
            "i": i,
            "date": s.date,
            "platform": s.platform.value,
            "pillar": s.pillar,
            "pillar_name": p.get("name", s.pillar),
            "pillar_purpose": p.get("purpose", ""),
        })

    context = {
        "business": brand["business"],
        "differentiators": brand["differentiators"],
        "programs": brand["programs"],
        "goals": brand["goals"],
        "voice": brand["voice"],
        "child_safety": brand["child_safety"],
        "platforms": {k: {"role": v["role"], "formats": v["formats"]}
                      for k, v in brand["platforms"].items()},
        "hashtags": brand["hashtags"],
        "ctas": brand["ctas"],
    }

    return f"""Create the organic content calendar for {year}-{month:02d}.

Below are pre-scheduled SLOTS (date + platform + content pillar are already chosen).
Write exactly ONE post per slot, in the same order, copying each slot's date,
platform, and pillar into the post.

For each post:
- Honor the platform's role and the pillar's purpose.
- format: pick a value valid for the platform
  (facebook: feed/photo/link; instagram: feed/reel/carousel/story; linkedin: text/image).
- caption: in the Bright Stars voice. Facebook = 1-3 short paragraphs; Instagram =
  punchy with line breaks; LinkedIn = professional and concise.
- hashtags: Facebook 0-3, Instagram 5-12, LinkedIn 2-4 (draw from or echo the
  hashtag banks; no duplicates).
- image_prompt: a concrete visual brief with NO identifiable children.
- call_to_action: one clear CTA.
- notes: the consent/photo check to do first (or "No consent needed").

Vary the topics so the month feels fresh — don't reuse the same hook twice.

CONTEXT (brand knowledge base):
{json.dumps(context, indent=2, ensure_ascii=False)}

SLOTS:
{json.dumps(slot_lines, indent=2)}
"""


def generate_calendar(settings: Settings, year: int, month: int, brand: dict | None = None) -> DraftCalendar:
    """Call Claude and return a validated DraftCalendar."""
    import anthropic  # imported lazily so non-generate commands don't need it

    brand = brand or load_brand()
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to .env, or run "
            "`python -m brightstars sample <month>` for an offline demo calendar."
        )

    slots = build_slots(brand, year, month)
    user = build_user_prompt(brand, year, month, slots)

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    kwargs = dict(
        model=settings.model,
        max_tokens=16000,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
        output_format=DraftCalendar,
    )
    # Adaptive thinking improves planning for this multi-constraint task.
    if os.getenv("BRIGHTSTARS_THINKING", "adaptive").lower() != "off":
        kwargs["thinking"] = {"type": "adaptive"}

    resp = client.messages.parse(**kwargs)
    draft = resp.parsed_output
    if draft is None:
        raise RuntimeError(
            f"Model did not return a parseable calendar (stop_reason={resp.stop_reason})."
        )
    return draft
