"""Export a self-contained preview HTML file — no server, no install.

Bundles the dashboard markup, CSS, JS, and the calendar/analytics data into one
HTML file you can open in any browser (or send to your phone). Approve/Skip are
read-only in the export; run `serve` for the interactive version.
"""
from __future__ import annotations

import json
from pathlib import Path

from . import calendar_store as store
from .analytics import content_analytics, performance_analytics
from .config import CONTENT_DIR, load_brand, settings

WEB_STATIC = Path(__file__).parent / "web" / "static"


def _available_months() -> list[str]:
    if not CONTENT_DIR.exists():
        return []
    return sorted(p.name for p in CONTENT_DIR.iterdir() if p.is_dir() and (p / "calendar.json").exists())


def build_html(months: list[str] | None = None) -> str:
    s = settings()
    months = months or _available_months()
    if not months:
        raise RuntimeError("No content to export. Run `generate` or `sample` first.")

    calendars: dict = {}
    analytics: dict = {}
    for m in months:
        cal = store.load(m)
        calendars[m] = json.loads(cal.model_dump_json())
        analytics[m] = {
            "content": content_analytics(cal),
            "performance": performance_analytics(s, cal),
        }

    data = {
        "status": {
            "connected": {
                "claude": bool(s.anthropic_api_key),
                "meta": bool(s.meta_page_token),
                "linkedin": bool(s.linkedin_token and s.linkedin_org_urn),
            },
            "business": load_brand()["business"],
            "model": s.model,
        },
        "months": sorted(months),
        "calendars": calendars,
        "analytics": analytics,
    }

    index = (WEB_STATIC / "index.html").read_text(encoding="utf-8")
    styles = (WEB_STATIC / "styles.css").read_text(encoding="utf-8")
    appjs = (WEB_STATIC / "app.js").read_text(encoding="utf-8")

    index = index.replace(
        '<link rel="stylesheet" href="/static/styles.css" />',
        f"<style>{styles}</style>",
    )
    # </ inside embedded JSON would prematurely close the <script>; escape it.
    payload = "<script>window.__BRIGHTSTARS__ = " + json.dumps(data).replace("</", "<\\/") + ";</script>"
    index = index.replace(
        '<script src="/static/app.js"></script>',
        payload + f"\n<script>{appjs}</script>",
    )
    return index


def export(month: str | None = None, out: str | None = None) -> Path:
    html = build_html([month] if month else None)
    out_path = Path(out) if out else (CONTENT_DIR / (month or "all") / "preview.html")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    return out_path
