"""Publish approved + due posts across platforms."""
from __future__ import annotations

from datetime import date, datetime, timezone

from .config import Settings
from .models import Calendar, Platform, Post, PostStatus
from .publishers.base import PublishResult
from .publishers.facebook import FacebookPublisher
from .publishers.instagram import InstagramPublisher
from .publishers.linkedin import LinkedInPublisher


def _publishers(settings: Settings) -> dict:
    return {
        Platform.facebook: FacebookPublisher(settings),
        Platform.instagram: InstagramPublisher(settings),
        Platform.linkedin: LinkedInPublisher(settings),
    }


def publish_due(
    cal: Calendar,
    settings: Settings,
    today: date | None = None,
    dry_run: bool = True,
) -> list[tuple[Post, PublishResult]]:
    """Publish every approved post whose scheduled date is today or earlier.

    On a successful live publish the post flips to `published` and records its
    permalink. Dry runs change nothing. Returns (post, result) pairs.
    """
    today = today or date.today()
    pubs = _publishers(settings)
    results: list[tuple[Post, PublishResult]] = []

    for p in cal.posts:
        if p.status != PostStatus.approved:
            continue
        if p.date > today.isoformat():
            continue  # not due yet

        res = pubs[p.platform].publish(p, dry_run=dry_run)
        results.append((p, res))

        if not dry_run and res.ok:
            p.status = PostStatus.published
            p.permalink = res.permalink
            p.published_at = datetime.now(timezone.utc).isoformat()
            p.error = None
        elif not res.ok:
            p.error = res.error

    return results
