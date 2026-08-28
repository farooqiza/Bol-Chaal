"""Facebook Page publishing via the Meta Graph API."""
from __future__ import annotations

import requests

from ..config import Settings
from ..models import Post
from .base import PublishResult, _with_tags


class FacebookPublisher:
    platform = "facebook"

    def __init__(self, settings: Settings):
        self.s = settings

    def _base(self) -> str:
        return f"https://graph.facebook.com/{self.s.meta_graph_version}"

    def ready(self) -> bool:
        return bool(self.s.meta_page_id and self.s.meta_page_token)

    def publish(self, post: Post, dry_run: bool = True) -> PublishResult:
        message = _with_tags(post.caption, post.hashtags)
        if dry_run:
            kind = "photo" if post.image_url else "feed"
            return PublishResult(ok=True, detail=f"[dry-run] facebook {kind}")
        if not self.ready():
            return PublishResult(ok=False, error="Missing META_PAGE_ID / META_PAGE_ACCESS_TOKEN")

        token = self.s.meta_page_token
        if post.image_url:  # photo post
            url = f"{self._base()}/{self.s.meta_page_id}/photos"
            data = {"url": post.image_url, "caption": message, "access_token": token}
        else:  # text / link post
            url = f"{self._base()}/{self.s.meta_page_id}/feed"
            data = {"message": message, "access_token": token}

        r = requests.post(url, data=data, timeout=30)
        if r.status_code >= 400:
            return PublishResult(ok=False, error=f"FB {r.status_code}: {r.text[:300]}")
        j = r.json()
        pid = j.get("post_id") or j.get("id")
        return PublishResult(
            ok=True,
            permalink=f"https://www.facebook.com/{pid}" if pid else None,
            detail=str(j),
        )
