"""Pre-compute posting slots for a month.

Code decides *when* and *which pillar* (reliable date math + even pillar
rotation); the AI only fills in the creative. This keeps scheduling correct and
lets the model focus on quality.
"""
from __future__ import annotations

import calendar as _cal
from collections import defaultdict
from dataclasses import dataclass
from datetime import date

from .models import Platform


@dataclass
class Slot:
    date: str          # YYYY-MM-DD
    platform: Platform
    pillar: str        # pillar id


def _weekdays(year: int, month: int) -> list[date]:
    last = _cal.monthrange(year, month)[1]
    return [date(year, month, d) for d in range(1, last + 1) if date(year, month, d).weekday() < 5]


def _spread(items: list, n: int) -> list:
    """Pick n items spread as evenly as possible across the list."""
    if n <= 0 or not items:
        return []
    if n >= len(items):
        return list(items)
    step = len(items) / n
    return [items[int(i * step)] for i in range(n)]


def build_slots(brand: dict, year: int, month: int) -> list[Slot]:
    platforms_cfg = brand.get("platforms", {})
    weekdays = _weekdays(year, month)

    weeks: dict[int, list[date]] = defaultdict(list)
    for dt in weekdays:
        weeks[dt.isocalendar()[1]].append(dt)

    slots: list[Slot] = []
    pillar_ptr: dict[str, int] = defaultdict(int)

    for offset, (pname, pcfg) in enumerate(platforms_cfg.items()):
        try:
            platform = Platform(pname)
        except ValueError:
            continue  # unknown platform in config
        per_week = int(pcfg.get("weekly_posts", 0))
        pillars = pcfg.get("pillars") or ["enrollment_cta"]

        for wk in sorted(weeks):
            wkdays = weeks[wk]
            # rotate each platform's preferred weekdays so channels don't all clump
            shift = offset % len(wkdays)
            rotated = wkdays[shift:] + wkdays[:shift]
            chosen = sorted(_spread(rotated, per_week))
            for dt in chosen:
                pillar = pillars[pillar_ptr[pname] % len(pillars)]
                pillar_ptr[pname] += 1
                slots.append(Slot(dt.isoformat(), platform, pillar))

    slots.sort(key=lambda s: (s.date, s.platform.value))
    return slots
