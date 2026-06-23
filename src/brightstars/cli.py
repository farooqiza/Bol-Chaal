"""Command-line interface for the Bright Stars content pipeline.

    python -m brightstars sample 2026-07         # offline demo calendar (no API key)
    python -m brightstars generate next          # AI-generate next month
    python -m brightstars review 2026-07          # re-render REVIEW.md
    python -m brightstars approve 2026-07 --all   # human-in-the-loop gate
    python -m brightstars skip 2026-07 --ids <id>
    python -m brightstars publish-due 2026-07      # dry-run by default
    python -m brightstars publish-due 2026-07 --live
    python -m brightstars list 2026-07
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date

from . import calendar_store as store
from . import review
from .approve import set_status
from .config import load_brand, settings
from .models import Calendar, PostStatus
from .publish import publish_due


def resolve_month(arg: str | None) -> tuple[int, int, str]:
    today = date.today()
    if arg in (None, "this"):
        y, m = today.year, today.month
    elif arg == "next":
        m = today.month % 12 + 1
        y = today.year + (1 if today.month == 12 else 0)
    else:
        y, m = (int(x) for x in arg.split("-")[:2])
    return y, m, f"{y:04d}-{m:02d}"


def _summary(cal: Calendar) -> str:
    counts = Counter(p.status.value for p in cal.posts)
    by_platform = Counter(p.platform.value for p in cal.posts)
    parts = [f"{n} {s}" for s, n in counts.items()]
    plats = ", ".join(f"{p}:{n}" for p, n in by_platform.items())
    return f"{len(cal.posts)} posts ({', '.join(parts)}) · {plats}"


def _after_build(cal: Calendar) -> None:
    cpath = store.save(cal)
    rpath = review.write(cal)
    print(f"✓ wrote {cpath}")
    print(f"✓ wrote {rpath}")
    print(f"  {_summary(cal)}")
    print(f"\nNext: open {rpath} to review, then `python -m brightstars approve {cal.month} --all`")


def cmd_generate(args) -> None:
    from .generator import generate_calendar  # lazy: only needs anthropic here

    y, m, month = resolve_month(args.month)
    s = settings()
    print(f"Generating {month} with {s.model} … (this calls the Claude API)")
    draft = generate_calendar(s, y, m)
    cal = store.from_draft(draft, model=s.model, month=month)
    _after_build(cal)


def cmd_sample(args) -> None:
    from .sample_data import generate_sample

    y, m, month = resolve_month(args.month)
    draft = generate_sample(load_brand(), y, m)
    cal = store.from_draft(draft, model="sample/offline", month=month)
    _after_build(cal)


def cmd_review(args) -> None:
    _, _, month = resolve_month(args.month)
    cal = store.load(month)
    print(f"✓ wrote {review.write(cal)}")


def _set(args, status: PostStatus) -> None:
    _, _, month = resolve_month(args.month)
    cal = store.load(month)
    n = set_status(cal, status, ids=args.ids, all_=args.all)
    store.save(cal)
    review.write(cal)
    print(f"✓ {n} post(s) → {status.value}. {_summary(cal)}")


def cmd_approve(args) -> None:
    _set(args, PostStatus.approved)


def cmd_skip(args) -> None:
    _set(args, PostStatus.skipped)


def cmd_publish(args) -> None:
    _, _, month = resolve_month(args.month)
    cal = store.load(month)
    on = date.fromisoformat(args.date) if args.date else date.today()
    dry = not args.live

    results = publish_due(cal, settings(), today=on, dry_run=dry)
    store.save(cal)
    review.write(cal)

    mode = "DRY-RUN" if dry else "LIVE"
    print(f"[{mode}] {len(results)} due post(s) as of {on.isoformat()}:")
    for p, res in results:
        flag = "✓" if res.ok else "✗"
        print(f"  {flag} {p.platform.value:9} {p.id}  {res.detail or res.error}")
    if not results:
        print("  (nothing approved + due — approve posts first or check the date)")
    if dry:
        print("\nThis was a dry run. Re-run with --live to publish for real.")


def cmd_list(args) -> None:
    _, _, month = resolve_month(args.month)
    cal = store.load(month)
    print(f"{cal.month} · {_summary(cal)}\n")
    for p in sorted(cal.posts, key=lambda x: (x.date, x.platform.value)):
        print(f"  {p.date}  {p.platform.value:9} {p.status.value:9} {p.pillar:18} {p.id}")


def cmd_serve(args) -> None:
    from .web.server import run  # lazy: only this command needs Flask

    print(f"Bright Stars Content Studio → http://{args.host}:{args.port}   (Ctrl+C to stop)")
    run(host=args.host, port=args.port, debug=args.debug)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="brightstars", description="Bright Stars organic social automation")
    sub = parser.add_subparsers(dest="command", required=True)

    def month_arg(p):
        p.add_argument("month", nargs="?", default="next", help="YYYY-MM, 'this', or 'next' (default: next)")

    p = sub.add_parser("generate", help="AI-generate a month of content")
    month_arg(p); p.set_defaults(func=cmd_generate)

    p = sub.add_parser("sample", help="offline templated calendar (no API key needed)")
    month_arg(p); p.set_defaults(func=cmd_sample)

    p = sub.add_parser("review", help="re-render REVIEW.md from calendar.json")
    month_arg(p); p.set_defaults(func=cmd_review)

    p = sub.add_parser("approve", help="approve posts for publishing")
    month_arg(p)
    p.add_argument("--all", action="store_true", help="approve every draft post")
    p.add_argument("--ids", nargs="*", default=[], help="approve specific post ids")
    p.set_defaults(func=cmd_approve)

    p = sub.add_parser("skip", help="skip (do not publish) posts")
    month_arg(p)
    p.add_argument("--all", action="store_true")
    p.add_argument("--ids", nargs="*", default=[])
    p.set_defaults(func=cmd_skip)

    p = sub.add_parser("publish-due", help="publish approved posts that are due (dry-run unless --live)")
    month_arg(p)
    p.add_argument("--live", action="store_true", help="actually publish (default is a dry run)")
    p.add_argument("--date", help="pretend 'today' is this YYYY-MM-DD (for testing)")
    p.set_defaults(func=cmd_publish)

    p = sub.add_parser("list", help="list posts and statuses")
    month_arg(p); p.set_defaults(func=cmd_list)

    p = sub.add_parser("serve", help="launch the web dashboard (preview + analytics)")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8000)
    p.add_argument("--debug", action="store_true")
    p.set_defaults(func=cmd_serve)

    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        args.func(args)
    except Exception as exc:  # friendly errors for non-developers
        print(f"Error: {exc}")
        return 1
    return 0
