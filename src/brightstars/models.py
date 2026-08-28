"""Data models for posts and content calendars.

`DraftPost` / `DraftCalendar` are the *exact* shape the AI returns (structured
output). `Post` / `Calendar` add storage + lifecycle fields the code manages.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class Platform(str, Enum):
    facebook = "facebook"
    instagram = "instagram"
    linkedin = "linkedin"


class PostFormat(str, Enum):
    feed = "feed"        # standard image post
    photo = "photo"      # photo post (Facebook)
    link = "link"        # link share
    reel = "reel"        # short video (Instagram)
    carousel = "carousel"
    story = "story"
    text = "text"        # text-only (LinkedIn)


class PostStatus(str, Enum):
    draft = "draft"          # AI-generated, awaiting human review
    approved = "approved"    # cleared to publish on its scheduled date
    published = "published"  # live
    skipped = "skipped"      # human chose not to publish


# ── What the AI produces (structured-output schema) ───────────────────────────
class DraftPost(BaseModel):
    date: str                 # YYYY-MM-DD (carried from the pre-computed slot)
    platform: Platform
    pillar: str               # content-pillar id from config/brand.yaml
    format: PostFormat
    caption: str              # full caption / post body
    hashtags: list[str]
    image_prompt: str         # brief for an AI image or stock photo — NEVER an identifiable child
    call_to_action: str
    notes: str                # consent/photo checks or scheduling notes for the reviewer


class DraftCalendar(BaseModel):
    month: str                # YYYY-MM
    posts: list[DraftPost]


# ── What we store and operate on ──────────────────────────────────────────────
class Post(DraftPost):
    id: str
    status: PostStatus = PostStatus.draft
    image_url: str | None = None    # public URL — required before Instagram publish
    published_at: str | None = None
    permalink: str | None = None
    error: str | None = None


class Calendar(BaseModel):
    month: str
    generated_at: str
    model: str
    posts: list[Post]
