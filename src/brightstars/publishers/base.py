from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PublishResult:
    ok: bool
    permalink: str | None = None
    error: str | None = None
    detail: str | None = None


def _with_tags(caption: str, hashtags: list[str]) -> str:
    return caption + ("\n\n" + " ".join(hashtags) if hashtags else "")
