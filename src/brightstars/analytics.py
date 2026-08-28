"""Analytics for the dashboard.

Two layers:
  * content_analytics  — computed from the calendar itself (always real).
  * performance_analytics — follower counts pulled live from Meta when connected,
    plus engagement metrics. Engagement is clearly-labeled SAMPLE data derived
    deterministically from the content until real post insights are wired in, so
    the dashboard is meaningful out of the box without ever faking "live" numbers.
"""
from __future__ import annotations

import hashlib
from collections import Counter, defaultdict
from datetime import date

from .config import Settings
from .models import Calendar

# Honest baselines from the current public presence (see project research).
_FOLLOWER_BASELINE = {"facebook": 505, "instagram": 3, "linkedin": 0}


def _seeded(seed: str, lo: int, hi: int) -> int:
    """Deterministic pseudo-value in [lo, hi] from a string seed (stable per post)."""
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    return lo + (h % (hi - lo + 1))


def content_analytics(cal: Calendar) -> dict:
    by_week: Counter[int] = Counter()
    for p in cal.posts:
        y, m, d = (int(x) for x in p.date.split("-"))
        by_week[date(y, m, d).isocalendar()[1]] += 1

    weekly = [{"week": f"Week {i+1}", "count": by_week[w]} for i, w in enumerate(sorted(by_week))]

    return {
        "month": cal.month,
        "model": cal.model,
        "generated_at": cal.generated_at,
        "total": len(cal.posts),
        "by_status": dict(Counter(p.status.value for p in cal.posts)),
        "by_platform": dict(Counter(p.platform.value for p in cal.posts)),
        "by_pillar": dict(Counter(p.pillar for p in cal.posts)),
        "by_date": dict(Counter(p.date for p in cal.posts)),
        "weekly": weekly,
    }


def _live_followers(s: Settings) -> dict:
    """Best-effort live follower counts from Meta. Degrades silently to {}."""
    import requests

    out: dict = {}
    base = f"https://graph.facebook.com/{s.meta_graph_version}"
    try:
        if s.meta_page_id and s.meta_page_token:
            r = requests.get(
                f"{base}/{s.meta_page_id}",
                params={"fields": "fan_count,followers_count", "access_token": s.meta_page_token},
                timeout=8,
            )
            if r.ok:
                j = r.json()
                out["facebook"] = j.get("followers_count") or j.get("fan_count")
        if s.meta_ig_user_id and s.meta_page_token:
            r = requests.get(
                f"{base}/{s.meta_ig_user_id}",
                params={"fields": "followers_count", "access_token": s.meta_page_token},
                timeout=8,
            )
            if r.ok:
                out["instagram"] = r.json().get("followers_count")
    except Exception:
        pass
    return {k: v for k, v in out.items() if v is not None}


def performance_analytics(settings: Settings, cal: Calendar) -> dict:
    connected = {
        "claude": bool(settings.anthropic_api_key),
        "meta": bool(settings.meta_page_token),
        "linkedin": bool(settings.linkedin_token and settings.linkedin_org_urn),
    }

    live = _live_followers(settings) if connected["meta"] else {}
    followers = {
        "source": "live" if live else "sample",
        "facebook": live.get("facebook", _FOLLOWER_BASELINE["facebook"]),
        "instagram": live.get("instagram", _FOLLOWER_BASELINE["instagram"]),
        "linkedin": _FOLLOWER_BASELINE["linkedin"],
    }

    # Engagement = SAMPLE, derived deterministically from published/approved posts.
    posts = [p for p in cal.posts if p.status.value in ("published", "approved")]
    per_post: list[dict] = []
    per_platform: dict = defaultdict(lambda: {"reach": 0, "interactions": 0, "posts": 0})

    for p in posts:
        reach = _seeded(p.id + "reach", 60, 520)
        rate = _seeded(p.id + "rate", 3, 9)
        inter = round(reach * rate / 100)
        likes = round(inter * 0.70)
        comments = round(inter * 0.12)
        shares = max(inter - likes - comments, 0)
        row = {
            "id": p.id, "platform": p.platform.value, "date": p.date, "pillar": p.pillar,
            "status": p.status.value, "reach": reach, "interactions": inter,
            "likes": likes, "comments": comments, "shares": shares,
        }
        per_post.append(row)
        pp = per_platform[p.platform.value]
        pp["reach"] += reach
        pp["interactions"] += inter
        pp["posts"] += 1

    total_reach = sum(x["reach"] for x in per_post)
    total_inter = sum(x["interactions"] for x in per_post)

    pillar_perf: dict[str, list[int]] = defaultdict(list)
    for x in per_post:
        pillar_perf[x["pillar"]].append(x["interactions"])
    best_pillar = (
        max(pillar_perf, key=lambda k: sum(pillar_perf[k]) / len(pillar_perf[k]))
        if pillar_perf else None
    )

    return {
        "source": "live" if live else "sample",
        "connected": connected,
        "followers": followers,
        "engagement_source": "sample",
        "totals": {
            "reach": total_reach,
            "interactions": total_inter,
            "rate": round((total_inter / total_reach * 100) if total_reach else 0, 1),
            "posts": len(per_post),
        },
        "per_platform": {k: dict(v) for k, v in per_platform.items()},
        "per_post": per_post,
        "top_posts": sorted(per_post, key=lambda x: x["interactions"], reverse=True)[:5],
        "best_pillar": best_pillar,
    }
