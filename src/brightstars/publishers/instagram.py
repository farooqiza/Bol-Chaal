"""Instagram publishing via the Instagram Graph API (two-step container flow).

Instagram requires a PUBLIC media URL — it cannot accept raw bytes. Each post
must have `image_url` (or a public video URL for reels) set before going live.
"""
from __future__ import annotations

import requests

from ..config import Settings
from ..models import Post
from .base import PublishResult, _with_tags


class InstagramPublisher:
    platform = "instagram"

    def __init__(self, settings: Settings):
        self.s = settings

    def _base(self) -> str:
        return f"https://graph.facebook.com/{self.s.meta_graph_version}"

    def ready(self) -> bool:
        return bool(self.s.meta_ig_user_id and self.s.meta_page_token)

    def publish(self, post: Post, dry_run: bool = True) -> PublishResult:
        caption = _with_tags(post.caption, post.hashtags)
        if dry_run:
            warn = "" if post.image_url else "  ⚠️ needs a public image_url before live"
            return PublishResult(ok=True, detail=f"[dry-run] instagram {post.format.value}{warn}")
        if not self.ready():
            return PublishResult(ok=False, error="Missing META_IG_USER_ID / META_PAGE_ACCESS_TOKEN")
        if not post.image_url:
            return PublishResult(ok=False, error="Instagram requires a public image_url; none set.")

        token = self.s.meta_page_token
        ig = self.s.meta_ig_user_id

        # 1) create media container
        if post.format.value == "reel":
            create = {"media_type": "REELS", "video_url": post.image_url, "caption": caption, "access_token": token}
        else:
            create = {"image_url": post.image_url, "caption": caption, "access_token": token}
        r = requests.post(f"{self._base()}/{ig}/media", data=create, timeout=60)
        if r.status_code >= 400:
            return PublishResult(ok=False, error=f"IG create {r.status_code}: {r.text[:300]}")
        creation_id = r.json().get("id")

        # 2) publish the container
        r2 = requests.post(
            f"{self._base()}/{ig}/media_publish",
            data={"creation_id": creation_id, "access_token": token},
            timeout=60,
        )
        if r2.status_code >= 400:
            return PublishResult(ok=False, error=f"IG publish {r2.status_code}: {r2.text[:300]}")
        media_id = r2.json().get("id")
        return PublishResult(ok=True, permalink=f"https://www.instagram.com/p/{media_id}" if media_id else None,
                             detail=str(r2.json()))
