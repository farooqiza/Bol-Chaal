"""Approve or skip posts (the human-in-the-loop gate)."""
from __future__ import annotations

from .models import Calendar, PostStatus


def set_status(cal: Calendar, status: PostStatus, ids: list[str] | None = None, all_: bool = False) -> int:
    """Move matching posts to `status`. Returns the number changed.

    Published posts are never re-touched (so we don't double-publish).
    """
    ids = set(ids or [])
    changed = 0
    for p in cal.posts:
        if not (all_ or p.id in ids):
            continue
        if p.status == PostStatus.published:
            continue
        if p.status != status:
            p.status = status
            changed += 1
    return changed
