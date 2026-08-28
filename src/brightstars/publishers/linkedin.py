"""LinkedIn organization publishing (hiring posts) via the LinkedIn Posts API."""
from __future__ import annotations

import requests

from ..config import Settings
from ..models import Post
from .base import PublishResult, _with_tags


class LinkedInPublisher:
    platform = "linkedin"

    def __init__(self, settings: Settings):
        self.s = settings

    def ready(self) -> bool:
        return bool(self.s.linkedin_org_urn and self.s.linkedin_token)

    def publish(self, post: Post, dry_run: bool = True) -> PublishResult:
        text = _with_tags(post.caption, post.hashtags)
        if dry_run:
            return PublishResult(ok=True, detail="[dry-run] linkedin text post")
        if not self.ready():
            return PublishResult(ok=False, error="Missing LINKEDIN_ORG_URN / LINKEDIN_ACCESS_TOKEN")

        headers = {
            "Authorization": f"Bearer {self.s.linkedin_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202401",
        }
        body = {
            "author": self.s.linkedin_org_urn,
            "commentary": text,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": [],
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }
        r = requests.post("https://api.linkedin.com/rest/posts", headers=headers, json=body, timeout=30)
        if r.status_code >= 400:
            return PublishResult(ok=False, error=f"LinkedIn {r.status_code}: {r.text[:300]}")
        post_id = r.headers.get("x-restli-id")
        return PublishResult(
            ok=True,
            permalink=f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None,
            detail=post_id,
        )
