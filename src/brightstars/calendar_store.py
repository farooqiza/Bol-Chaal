"""Load/save content calendars and assign stable post ids."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from .config import CONTENT_DIR
from .models import Calendar, DraftCalendar, Post


def month_dir(month: str) -> Path:
    return CONTENT_DIR / month


def calendar_path(month: str) -> Path:
    return month_dir(month) / "calendar.json"


def _post_id(idx: int, date: str, platform: str) -> str:
    return f"{date}-{platform}-{idx:02d}"


def from_draft(draft: DraftCalendar, model: str, month: str) -> Calendar:
    posts = [
        Post(id=_post_id(i, d.date, d.platform.value), **d.model_dump())
        for i, d in enumerate(draft.posts)
    ]
    return Calendar(
        month=month,
        generated_at=datetime.now(timezone.utc).isoformat(),
        model=model,
        posts=posts,
    )


def save(cal: Calendar) -> Path:
    path = calendar_path(cal.month)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(cal.model_dump_json(indent=2), encoding="utf-8")
    return path


def load(month: str) -> Calendar:
    path = calendar_path(month)
    if not path.exists():
        raise FileNotFoundError(
            f"No calendar at {path}. Run `generate {month}` (or `sample {month}`) first."
        )
    return Calendar.model_validate_json(path.read_text(encoding="utf-8"))
