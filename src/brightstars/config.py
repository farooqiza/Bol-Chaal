"""Configuration: brand knowledge base + runtime secrets."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml

try:  # optional in CI where env is injected directly
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    pass

# repo root = three parents up from this file (src/brightstars/config.py)
REPO_ROOT = Path(__file__).resolve().parents[2]
BRAND_FILE = REPO_ROOT / "config" / "brand.yaml"
CONTENT_DIR = REPO_ROOT / "content"

DEFAULT_MODEL = "claude-opus-4-8"


@lru_cache(maxsize=1)
def load_brand() -> dict:
    """Load and cache the brand knowledge base."""
    with open(BRAND_FILE, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


@dataclass(frozen=True)
class Settings:
    """Runtime settings sourced from environment variables."""

    anthropic_api_key: str | None
    model: str
    # Meta (Facebook + Instagram)
    meta_page_id: str | None
    meta_page_token: str | None
    meta_ig_user_id: str | None
    meta_graph_version: str
    # LinkedIn
    linkedin_org_urn: str | None
    linkedin_token: str | None


def settings() -> Settings:
    return Settings(
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        model=os.getenv("BRIGHTSTARS_MODEL", DEFAULT_MODEL),
        meta_page_id=os.getenv("META_PAGE_ID"),
        meta_page_token=os.getenv("META_PAGE_ACCESS_TOKEN"),
        meta_ig_user_id=os.getenv("META_IG_USER_ID"),
        meta_graph_version=os.getenv("META_GRAPH_VERSION", "v21.0"),
        linkedin_org_urn=os.getenv("LINKEDIN_ORG_URN"),
        linkedin_token=os.getenv("LINKEDIN_ACCESS_TOKEN"),
    )
