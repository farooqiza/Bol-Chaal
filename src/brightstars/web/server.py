"""Flask app serving the preview + analytics dashboard.

Local tool — binds to 127.0.0.1 by default and has no auth (don't expose it
publicly). It never returns secret values, only booleans for connection status.
"""
from __future__ import annotations

import json
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from .. import calendar_store as store
from .. import review
from ..analytics import content_analytics, performance_analytics
from ..approve import set_status
from ..config import CONTENT_DIR, load_brand, settings
from ..models import PostStatus

STATIC = Path(__file__).parent / "static"


def _cal_json(cal) -> dict:
    return json.loads(cal.model_dump_json())


def create_app() -> Flask:
    app = Flask(__name__, static_folder=str(STATIC), static_url_path="/static")

    @app.get("/")
    def index():
        return send_from_directory(STATIC, "index.html")

    @app.get("/api/status")
    def status():
        s = settings()
        return jsonify({
            "connected": {
                "claude": bool(s.anthropic_api_key),
                "meta": bool(s.meta_page_token),
                "linkedin": bool(s.linkedin_token and s.linkedin_org_urn),
            },
            "business": load_brand()["business"],
            "model": s.model,
        })

    @app.get("/api/months")
    def months():
        ms = []
        if CONTENT_DIR.exists():
            ms = sorted(
                p.name for p in CONTENT_DIR.iterdir()
                if p.is_dir() and (p / "calendar.json").exists()
            )
        return jsonify({"months": ms, "latest": ms[-1] if ms else None})

    @app.get("/api/calendar/<month>")
    def calendar(month):
        try:
            return jsonify(_cal_json(store.load(month)))
        except FileNotFoundError as exc:
            return jsonify({"error": str(exc)}), 404

    @app.get("/api/analytics/<month>")
    def analytics(month):
        try:
            cal = store.load(month)
        except FileNotFoundError as exc:
            return jsonify({"error": str(exc)}), 404
        return jsonify({
            "content": content_analytics(cal),
            "performance": performance_analytics(settings(), cal),
        })

    def _mutate(month: str, new_status: PostStatus):
        try:
            cal = store.load(month)
        except FileNotFoundError as exc:
            return jsonify({"error": str(exc)}), 404
        body = request.get_json(silent=True) or {}
        changed = set_status(cal, new_status, ids=body.get("ids"), all_=bool(body.get("all")))
        store.save(cal)
        review.write(cal)
        return jsonify({"changed": changed, "calendar": _cal_json(cal)})

    @app.post("/api/calendar/<month>/approve")
    def approve(month):
        return _mutate(month, PostStatus.approved)

    @app.post("/api/calendar/<month>/skip")
    def skip(month):
        return _mutate(month, PostStatus.skipped)

    @app.post("/api/calendar/<month>/reset")
    def reset(month):  # back to draft
        return _mutate(month, PostStatus.draft)

    @app.post("/api/sample/<month>")
    def make_sample(month):
        from ..sample_data import generate_sample
        y, m = (int(x) for x in month.split("-")[:2])
        cal = store.from_draft(generate_sample(load_brand(), y, m), model="sample/offline", month=month)
        store.save(cal)
        review.write(cal)
        return jsonify({"ok": True, "month": month})

    @app.post("/api/generate/<month>")
    def make_generate(month):
        from ..generator import generate_calendar
        s = settings()
        y, m = (int(x) for x in month.split("-")[:2])
        try:
            draft = generate_calendar(s, y, m)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 400
        cal = store.from_draft(draft, model=s.model, month=month)
        store.save(cal)
        review.write(cal)
        return jsonify({"ok": True, "month": month})

    return app


def run(host: str = "127.0.0.1", port: int = 8000, debug: bool = False) -> None:
    create_app().run(host=host, port=port, debug=debug)
