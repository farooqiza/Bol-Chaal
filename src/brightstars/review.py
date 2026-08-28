"""Render a human-friendly REVIEW.md from a calendar."""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from .calendar_store import month_dir
from .models import Calendar

_ICON = {
    "draft": "◻️ draft",
    "approved": "✅ approved",
    "published": "🚀 published",
    "skipped": "🚫 skipped",
}


def render(cal: Calendar) -> str:
    by_date: dict[str, list] = defaultdict(list)
    for p in cal.posts:
        by_date[p.date].append(p)

    out: list[str] = [
        f"# Bright Stars — Content Review · {cal.month}",
        "",
        f"Generated {cal.generated_at} · model `{cal.model}` · {len(cal.posts)} posts",
        "",
        "Read each post, edit `calendar.json` if you want changes, then approve:",
        "",
        f"```\npython -m brightstars approve {cal.month} --all\n```",
        "",
        "Approve or skip specific posts by the `id` in each heading "
        f"(`--ids <id> <id>` / `python -m brightstars skip {cal.month} --ids <id>`).",
        "",
        "> ⚠️ **Child-safety check:** before publishing any post that uses a real "
        "child's photo, confirm a signed photo release is on file for that child. "
        "When in doubt, use a no-faces visual.",
        "",
        "---",
        "",
    ]

    for d in sorted(by_date):
        out.append(f"## {d}")
        for p in by_date[d]:
            out += [
                "",
                f"### `{p.id}` · **{p.platform.value}** · {p.pillar} · {p.format.value}  —  "
                f"{_ICON.get(p.status.value, p.status.value)}",
                "",
                p.caption,
                "",
            ]
            if p.hashtags:
                out.append("**Hashtags:** " + " ".join(p.hashtags))
            out.append(f"**CTA:** {p.call_to_action}")
            out.append(f"**Image idea:** {p.image_prompt}")
            if p.image_url:
                out.append(f"**Image URL:** {p.image_url}")
            out.append(f"**Notes:** {p.notes}")
            if p.permalink:
                out.append(f"**Live:** {p.permalink}")
            out += ["", "---"]
    return "\n".join(out) + "\n"


def write(cal: Calendar) -> Path:
    path = month_dir(cal.month) / "REVIEW.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render(cal), encoding="utf-8")
    return path
